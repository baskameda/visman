package eu.poc.claude.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link AppConfig}.
 *
 * Source file: 13 lines. An annotation-only configuration class.
 * Verifies that the scheduling infrastructure is correctly enabled.
 *
 * Target: 100 % of testable code.
 */
@DisplayName("AppConfig")
class AppConfigTest {

    @Test
    @DisplayName("class is annotated with @Configuration")
    void isConfiguration() {
        assertThat(AppConfig.class.getAnnotation(Configuration.class))
                .isNotNull();
    }

    @Test
    @DisplayName("class is annotated with @EnableScheduling")
    void enablesScheduling() {
        assertThat(AppConfig.class.getAnnotation(EnableScheduling.class))
                .isNotNull();
    }

    @Test
    @DisplayName("can be instantiated (empty config)")
    void canBeInstantiated() {
        AppConfig config = new AppConfig();
        assertThat(config).isNotNull();
    }

    @Test
    @DisplayName("is in the config sub-package")
    void correctPackage() {
        assertThat(AppConfig.class.getPackageName())
                .isEqualTo("eu.poc.claude.config");
    }
}
