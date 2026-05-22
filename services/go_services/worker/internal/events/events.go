package events

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/prestonparis/webwidgets/worker/internal/config"
	"github.com/rs/zerolog"
)

const (
	maxBatchSize = 100
	maxEventSize = 10_000 // 10KB per event
)

type Event struct {
	Type      string                 `json:"type"`
	UserID    string                 `json:"user_id,omitempty"`
	Source    string                 `json:"source,omitempty"`
	Timestamp string                 `json:"timestamp,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

type IngestRequest struct {
	Events []Event `json:"events"`
}

type IngestResponse struct {
	Accepted int `json:"accepted"`
	Rejected int `json:"rejected"`
}

type Service struct {
	cfg    *config.Config
	log    zerolog.Logger
	queue  chan Event
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
		queue:  make(chan Event, cfg.QueueSize),
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
			s.log.Info().Msg("Event processor stopping")
			return
		case event := <-s.queue:
			s.processEvent(event)
		}
	}
}

func (s *Service) processEvent(event Event) {
	// TODO: In future phases, this will write to Supabase or other durable storage
	// For now, we log and track metrics
	s.log.Debug().
		Str("type", event.Type).
		Str("user_id", event.UserID).
		Str("source", event.Source).
		Msg("Processing event")

	s.mu.Lock()
	s.stats.accepted++
	s.mu.Unlock()
}

func (s *Service) Ingest(req IngestRequest) IngestResponse {
	if len(req.Events) == 0 {
		return IngestResponse{Accepted: 0, Rejected: 0}
	}

	if len(req.Events) > maxBatchSize {
		s.log.Warn().
			Int("batch_size", len(req.Events)).
			Int("max_batch_size", maxBatchSize).
			Msg("Batch size exceeded, rejecting entire batch")
		return IngestResponse{Accepted: 0, Rejected: len(req.Events)}
	}

	accepted := 0
	rejected := 0

	for _, event := range req.Events {
		if err := s.validateEvent(event); err != nil {
			s.log.Warn().Err(err).Str("type", event.Type).Msg("Event validation failed")
			rejected++
			s.mu.Lock()
			s.stats.rejected++
			s.mu.Unlock()
			continue
		}

		// Add timestamp if not provided
		if event.Timestamp == "" {
			event.Timestamp = time.Now().UTC().Format(time.RFC3339)
		}

		select {
		case s.queue <- event:
			accepted++
			s.mu.Lock()
			s.stats.queued++
			s.mu.Unlock()
		default:
			// Queue is full, reject with backpressure
			s.log.Warn().Msg("Event queue full, applying backpressure")
			rejected++
			s.mu.Lock()
			s.stats.rejected++
			s.mu.Unlock()
		}
	}

	s.log.Info().
		Int("accepted", accepted).
		Int("rejected", rejected).
		Int("queue_depth", s.QueueDepth()).
		Msg("Event ingest completed")

	return IngestResponse{Accepted: accepted, Rejected: rejected}
}

func (s *Service) validateEvent(event Event) error {
	if event.Type == "" {
		return fmt.Errorf("event type is required")
	}
	if len(event.Type) > 100 {
		return fmt.Errorf("event type too long (max 100 chars)")
	}

	// Validate metadata size
	if event.Metadata != nil {
		if data, err := json.Marshal(event.Metadata); err == nil {
			if len(data) > maxEventSize {
				return fmt.Errorf("event metadata too large (max %d bytes)", maxEventSize)
			}
		}
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

// HTTP handler for events ingest
func (s *Service) HandleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req IngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.log.Error().Err(err).Msg("Failed to decode ingest request")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp := s.Ingest(req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
