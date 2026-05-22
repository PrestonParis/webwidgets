package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port      string
	LogLevel  string
	Version   string
	QueueSize int
}

func Load() *Config {
	queueSize := 1000
	if qs := os.Getenv("WORKER_QUEUE_SIZE"); qs != "" {
		if n, err := strconv.Atoi(qs); err == nil && n > 0 {
			queueSize = n
		}
	}

	return &Config{
		Port:      getEnv("WORKER_PORT", "8081"),
		LogLevel:  getEnv("WORKER_LOG_LEVEL", "info"),
		Version:   getEnv("WORKER_VERSION", "dev"),
		QueueSize: queueSize,
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
