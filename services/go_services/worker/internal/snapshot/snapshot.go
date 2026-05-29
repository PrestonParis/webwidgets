package snapshot

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/prestonparis/webwidgets/worker/internal/config"
	"github.com/rs/zerolog"
)

type WidgetInput struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Visible     *bool  `json:"visible,omitempty"`
	ContainerID string `json:"container_id,omitempty"`
}

type SnapshotPrecomputeJob struct {
	UserID   string         `json:"user_id,omitempty"`
	Widgets  []WidgetInput  `json:"widgets"`
	Priority string         `json:"priority,omitempty"` // "low", "normal", "high"
}

type SnapshotPrecomputeRequest struct {
	Job SnapshotPrecomputeJob `json:"job"`
}

type SnapshotPrecomputeResponse struct {
	Queued  bool   `json:"queued"`
	JobID   string `json:"job_id,omitempty"`
	Reason  string `json:"reason,omitempty"`
}

type Service struct {
	cfg    *config.Config
	log    zerolog.Logger
	queue  chan SnapshotPrecomputeJob
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
		queue:  make(chan SnapshotPrecomputeJob, cfg.QueueSize),
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
			s.log.Info().Msg("Snapshot processor stopping")
			return
		case job := <-s.queue:
			s.processJob(job)
		}
	}
}

func (s *Service) processJob(job SnapshotPrecomputeJob) {
	// TODO: In future phases, this will:
	// 1. Fetch widget data from connectors
	// 2. Build dashboard snapshot
	// 3. Store snapshot in cache/database
	// For now, we log and track metrics
	s.log.Debug().
		Str("user_id", job.UserID).
		Int("widget_count", len(job.Widgets)).
		Str("priority", job.Priority).
		Msg("Processing snapshot precompute job")

	s.mu.Lock()
	s.stats.accepted++
	s.mu.Unlock()
}

func (s *Service) Enqueue(req SnapshotPrecomputeRequest) SnapshotPrecomputeResponse {
	if err := s.validateJob(req.Job); err != nil {
		s.log.Warn().Err(err).Msg("Snapshot job validation failed")
		s.mu.Lock()
		s.stats.rejected++
		s.mu.Unlock()
		return SnapshotPrecomputeResponse{Queued: false, Reason: err.Error()}
	}

	// Set default priority if not provided
	if req.Job.Priority == "" {
		req.Job.Priority = "normal"
	}

	select {
	case s.queue <- req.Job:
		jobID := fmt.Sprintf("snap-%d", len(s.queue))
		s.mu.Lock()
		s.stats.queued++
		s.mu.Unlock()
		s.log.Info().
			Str("job_id", jobID).
			Str("user_id", req.Job.UserID).
			Int("widget_count", len(req.Job.Widgets)).
			Str("priority", req.Job.Priority).
			Int("queue_depth", s.QueueDepth()).
			Msg("Snapshot precompute job queued")
		return SnapshotPrecomputeResponse{Queued: true, JobID: jobID}
	default:
		// Queue is full, reject with backpressure
		s.log.Warn().Msg("Snapshot queue full, applying backpressure")
		s.mu.Lock()
		s.stats.rejected++
		s.mu.Unlock()
		return SnapshotPrecomputeResponse{Queued: false, Reason: "queue_full"}
	}
}

func (s *Service) validateJob(job SnapshotPrecomputeJob) error {
	if len(job.Widgets) == 0 {
		return fmt.Errorf("at least one widget is required")
	}

	if len(job.Widgets) > 100 {
		return fmt.Errorf("too many widgets (max 100)")
	}

	for _, widget := range job.Widgets {
		if widget.ID == "" {
			return fmt.Errorf("widget ID is required")
		}
		if widget.Type == "" {
			return fmt.Errorf("widget type is required")
		}
	}

	// Validate priority
	if job.Priority != "" && job.Priority != "low" && job.Priority != "normal" && job.Priority != "high" {
		return fmt.Errorf("invalid priority (must be 'low', 'normal', or 'high')")
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

// HTTP handler for snapshot precompute
func (s *Service) HandlePrecompute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SnapshotPrecomputeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.log.Error().Err(err).Msg("Failed to decode snapshot precompute request")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp := s.Enqueue(req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
