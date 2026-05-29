package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/prestonparis/webwidgets/worker/internal/cache"
	"github.com/prestonparis/webwidgets/worker/internal/config"
	"github.com/prestonparis/webwidgets/worker/internal/events"
	"github.com/prestonparis/webwidgets/worker/internal/health"
	"github.com/prestonparis/webwidgets/worker/internal/snapshot"
	"github.com/rs/zerolog"
)

type Server struct {
	cfg        *config.Config
	log        zerolog.Logger
	health     *health.Health
	eventSvc   *events.Service
	cacheSvc   *cache.Service
	snapshotSvc *snapshot.Service
	httpSrv    *http.Server
}

func New(cfg *config.Config, log zerolog.Logger, healthSvc *health.Health) *Server {
	eventSvc := events.New(cfg, log)
	cacheSvc := cache.New(cfg, log)
	snapshotSvc := snapshot.New(cfg, log)

	s := &Server{
		cfg:         cfg,
		log:         log,
		health:      healthSvc,
		eventSvc:    eventSvc,
		cacheSvc:    cacheSvc,
		snapshotSvc: snapshotSvc,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.healthz)
	mux.HandleFunc("/readyz", s.readyz)
	mux.HandleFunc("/metrics", s.metrics)
	mux.HandleFunc("/v1/events/ingest", s.eventSvc.HandleIngest)
	mux.HandleFunc("/v1/cache/write", s.cacheSvc.HandleWrite)
	mux.HandleFunc("/v1/jobs/snapshot-precompute", s.snapshotSvc.HandlePrecompute)

	s.httpSrv = &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      s.loggingMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return s
}

func (s *Server) Addr() string {
	return s.httpSrv.Addr
}

func (s *Server) ListenAndServe() error {
	return s.httpSrv.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.eventSvc.Shutdown()
	s.cacheSvc.Shutdown()
	s.snapshotSvc.Shutdown()
	return s.httpSrv.Shutdown(ctx)
}

func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log := s.log.With().
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Str("remote_addr", r.RemoteAddr).
			Logger()

		// Generate request ID
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		log = log.With().Str("request_id", requestID).Logger()
		r.Header.Set("X-Request-ID", requestID)

		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		log.Info().
			Int("status", wrapped.status).
			Dur("duration_ms", duration).
			Msg("HTTP request")
	})
}

func (s *Server) healthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"version":   s.cfg.Version,
		"uptime_ms": s.health.Uptime().Milliseconds(),
	})
}

func (s *Server) readyz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := s.health.GetStatus()
	if status == health.StatusReady {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ready",
		})
	} else {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "not_ready",
		})
	}
}

func (s *Server) metrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	eventsAccepted, eventsRejected, eventsQueued := s.eventSvc.Stats()
	cacheAccepted, cacheRejected, cacheQueued := s.cacheSvc.Stats()
	snapAccepted, snapRejected, snapQueued := s.snapshotSvc.Stats()

	metrics := map[string]interface{}{
		"uptime_ms": s.health.Uptime().Milliseconds(),
		"events": map[string]interface{}{
			"accepted": eventsAccepted,
			"rejected": eventsRejected,
			"queued":   eventsQueued,
			"queue_depth": s.eventSvc.QueueDepth(),
		},
		"cache": map[string]interface{}{
			"accepted": cacheAccepted,
			"rejected": cacheRejected,
			"queued":   cacheQueued,
			"queue_depth": s.cacheSvc.QueueDepth(),
		},
		"snapshot": map[string]interface{}{
			"accepted": snapAccepted,
			"rejected": snapRejected,
			"queued":   snapQueued,
			"queue_depth": s.snapshotSvc.QueueDepth(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(metrics)
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.status = statusCode
	rw.ResponseWriter.WriteHeader(statusCode)
}
