package cache

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/prestonparis/webwidgets/worker/internal/config"
	"github.com/rs/zerolog"
)

const (
	maxKeyLength     = 500
	maxNamespaceLength = 100
	maxPayloadSize   = 1_000_000 // 1MB
	defaultTTL       = 3600     // 1 hour
)

type CacheWriteJob struct {
	Key        string                 `json:"key"`
	Namespace  string                 `json:"namespace"`
	Value      interface{}            `json:"value"`
	TTLSeconds int                    `json:"ttl_seconds,omitempty"`
}

type CacheWriteRequest struct {
	Job CacheWriteJob `json:"job"`
}

type CacheWriteResponse struct {
	Queued  bool   `json:"queued"`
	Reason  string `json:"reason,omitempty"`
}

type Service struct {
	cfg    *config.Config
	log    zerolog.Logger
	queue  chan CacheWriteJob
	wg     sync.WaitGroup
	stopCh chan struct{}
	mu     sync.RWMutex
	stats  struct {
		accepted int
		rejected int
		queued   int
	}
}

func New(cfg *config.Config, log zerolog.Logger) *Service {
	s := &Service{
		cfg:    cfg,
		log:    log,
		queue:  make(chan CacheWriteJob, cfg.QueueSize),
		stopCh: make(chan struct{}),
	}

	s.wg.Add(1)
	go s.processQueue()

	return s
}

func (s *Service) Shutdown() {
	close(s.stopCh)
	s.wg.Wait()
	close(s.queue)
}

func (s *Service) processQueue() {
	defer s.wg.Done()

	for {
		select {
		case <-s.stopCh:
			s.log.Info().Msg("Cache processor stopping")
			return
		case job := <-s.queue:
			s.processJob(job)
		}
	}
}

func (s *Service) processJob(job CacheWriteJob) {
	// TODO: In future phases, this will write to Redis or other cache backend
	// For now, we log and track metrics
	s.log.Debug().
		Str("key", job.Key).
		Str("namespace", job.Namespace).
		Int("ttl_seconds", job.TTLSeconds).
		Msg("Processing cache write job")

	s.mu.Lock()
	s.stats.accepted++
	s.mu.Unlock()
}

func (s *Service) Enqueue(req CacheWriteRequest) CacheWriteResponse {
	if err := s.validateJob(req.Job); err != nil {
		s.log.Warn().Err(err).Str("key", req.Job.Key).Msg("Cache job validation failed")
		s.mu.Lock()
		s.stats.rejected++
		s.mu.Unlock()
		return CacheWriteResponse{Queued: false, Reason: err.Error()}
	}

	// Set default TTL if not provided
	if req.Job.TTLSeconds <= 0 {
		req.Job.TTLSeconds = defaultTTL
	}

	select {
	case s.queue <- req.Job:
		s.mu.Lock()
		s.stats.queued++
		s.mu.Unlock()
		s.log.Info().
			Str("key", req.Job.Key).
			Str("namespace", req.Job.Namespace).
			Int("queue_depth", s.QueueDepth()).
			Msg("Cache write job queued")
		return CacheWriteResponse{Queued: true}
	default:
		// Queue is full, reject with backpressure
		s.log.Warn().Msg("Cache queue full, applying backpressure")
		s.mu.Lock()
		s.stats.rejected++
		s.mu.Unlock()
		return CacheWriteResponse{Queued: false, Reason: "queue_full"}
	}
}

func (s *Service) validateJob(job CacheWriteJob) error {
	if job.Key == "" {
		return fmt.Errorf("cache key is required")
	}
	if len(job.Key) > maxKeyLength {
		return fmt.Errorf("cache key too long (max %d chars)", maxKeyLength)
	}

	if job.Namespace == "" {
		return fmt.Errorf("cache namespace is required")
	}
	if len(job.Namespace) > maxNamespaceLength {
		return fmt.Errorf("cache namespace too long (max %d chars)", maxNamespaceLength)
	}

	// Validate payload size
	if job.Value != nil {
		if data, err := json.Marshal(job.Value); err == nil {
			if len(data) > maxPayloadSize {
				return fmt.Errorf("cache payload too large (max %d bytes)", maxPayloadSize)
			}
		}
	}

	// Validate TTL
	if job.TTLSeconds < 0 {
		return fmt.Errorf("TTL must be non-negative")
	}
	if job.TTLSeconds > 86400*30 { // Max 30 days
		return fmt.Errorf("TTL too large (max 30 days)")
	}

	return nil
}

func (s *Service) QueueDepth() int {
	return len(s.queue)
}

func (s *Service) Stats() (accepted, rejected, queued int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.stats.accepted, s.stats.rejected, s.stats.queued
}

// HTTP handler for cache write
func (s *Service) HandleWrite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CacheWriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.log.Error().Err(err).Msg("Failed to decode cache write request")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp := s.Enqueue(req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
