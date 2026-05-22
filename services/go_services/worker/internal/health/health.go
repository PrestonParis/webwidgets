package health

import (
	"sync"
	"time"

	"github.com/prestonparis/webwidgets/worker/internal/config"
)

type Status string

const (
	StatusReady   Status = "ready"
	StatusNotReady Status = "not_ready"
)

type Health struct {
	cfg       *config.Config
	mu        sync.RWMutex
	status    Status
	startedAt time.Time
}

func New(cfg *config.Config) *Health {
	return &Health{
		cfg:       cfg,
		status:    StatusReady,
		startedAt: time.Now(),
	}
}

func (h *Health) GetStatus() Status {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.status
}

func (h *Health) SetNotReady() {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.status = StatusNotReady
}

func (h *Health) SetReady() {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.status = StatusReady
}

func (h *Health) Shutdown() {
	h.SetNotReady()
}

func (h *Health) Uptime() time.Duration {
	return time.Since(h.startedAt)
}
