package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prestonparis/webwidgets/worker/internal/config"
	"github.com/prestonparis/webwidgets/worker/internal/health"
	"github.com/prestonparis/webwidgets/worker/internal/logger"
	"github.com/prestonparis/webwidgets/worker/internal/server"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.LogLevel)

	log.Info().
		Str("version", cfg.Version).
		Str("port", cfg.Port).
		Msg("Starting Go worker service")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Health check service
	healthSvc := health.New(cfg)

	// HTTP server
	srv := server.New(cfg, log, healthSvc)

	// Start server in background
	serverErr := make(chan error, 1)
	go func() {
		log.Info().Str("addr", srv.Addr()).Msg("HTTP server listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErr <- err
		}
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		log.Fatal().Err(err).Msg("Server error")
	case sig := <-sigChan:
		log.Info().Str("signal", sig.String()).Msg("Shutdown signal received")
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 30*time.Second)
	defer shutdownCancel()

	log.Info().Msg("Shutting down server...")
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("Server shutdown error")
	}

	healthSvc.Shutdown()
	log.Info().Msg("Shutdown complete")
}
