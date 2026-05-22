package logger

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func New(level string) zerolog.Logger {
	// Set global log level
	switch level {
	case "debug":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "info":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	case "warn":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "error":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	// Configure output format
	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stderr,
		NoColor:    os.Getenv("NO_COLOR") != "",
		TimeFormat: "2006-01-02T15:04:05Z07:00",
	})

	return log.Logger
}
