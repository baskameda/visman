package eu.poc.claude.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring's @Scheduled infrastructure used by TaskEventService
 * to poll for BPM task changes and push SSE notifications.
 */
@Configuration
@EnableScheduling
public class AppConfig {
}
