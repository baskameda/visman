package eu.poc.claude.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link WebSecurityConfig}.
 *
 * Source file: 50 lines.
 * <ul>
 *   <li>restApiSecurityFilterChain — needs HttpSecurity (Spring integration), tested via annotation checks</li>
 *   <li>corsFilter() — testable: returns a CorsFilter wrapping corsConfigurationSource()</li>
 *   <li>corsConfigurationSource() — private, tested via reflection for all CORS properties</li>
 * </ul>
 * Target: 100 % line + branch coverage for the CORS config; annotation verification for the security chain.
 */
@DisplayName("WebSecurityConfig")
class WebSecurityConfigTest {

    private WebSecurityConfig config;

    @BeforeEach
    void setUp() {
        config = new WebSecurityConfig();
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Private corsConfigurationSource() — tested via reflection
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("corsConfigurationSource()")
    class CorsConfigurationSourceTests {

        private CorsConfiguration corsConfig;

        @BeforeEach
        void extractCorsConfig() throws Exception {
            UrlBasedCorsConfigurationSource source = invokeCorsConfigSource();
            // The source was registered for "/**"
            corsConfig = source.getCorsConfigurations().get("/**");
            assertThat(corsConfig).as("CORS config registered for /**").isNotNull();
        }

        @Test
        @DisplayName("allows credentials (line 37)")
        void allowsCredentials() {
            assertThat(corsConfig.getAllowCredentials()).isTrue();
        }

        @Test
        @DisplayName("allowed origins include localhost:5173 (Vite dev)")
        void allowsViteOrigin() {
            assertThat(corsConfig.getAllowedOrigins())
                    .contains("http://localhost:5173");
        }

        @Test
        @DisplayName("allowed origins include localhost:3000 (CRA dev)")
        void allowsCraOrigin() {
            assertThat(corsConfig.getAllowedOrigins())
                    .contains("http://localhost:3000");
        }

        @Test
        @DisplayName("exactly 2 allowed origins (no wildcards)")
        void exactlyTwoOrigins() {
            assertThat(corsConfig.getAllowedOrigins()).hasSize(2);
        }

        @Test
        @DisplayName("allowed headers = wildcard (*)")
        void allowsAllHeaders() {
            assertThat(corsConfig.getAllowedHeaders()).containsExactly("*");
        }

        @Test
        @DisplayName("allowed methods include GET")
        void allowsGet() {
            assertThat(corsConfig.getAllowedMethods()).contains("GET");
        }

        @Test
        @DisplayName("allowed methods include POST")
        void allowsPost() {
            assertThat(corsConfig.getAllowedMethods()).contains("POST");
        }

        @Test
        @DisplayName("allowed methods include PUT")
        void allowsPut() {
            assertThat(corsConfig.getAllowedMethods()).contains("PUT");
        }

        @Test
        @DisplayName("allowed methods include DELETE")
        void allowsDelete() {
            assertThat(corsConfig.getAllowedMethods()).contains("DELETE");
        }

        @Test
        @DisplayName("allowed methods include OPTIONS (preflight)")
        void allowsOptions() {
            assertThat(corsConfig.getAllowedMethods()).contains("OPTIONS");
        }

        @Test
        @DisplayName("allowed methods include HEAD")
        void allowsHead() {
            assertThat(corsConfig.getAllowedMethods()).contains("HEAD");
        }

        @Test
        @DisplayName("exactly 6 HTTP methods allowed")
        void exactlySixMethods() {
            assertThat(corsConfig.getAllowedMethods()).hasSize(6);
        }

        @Test
        @DisplayName("maxAge = 3600 seconds (1 hour cache for preflight)")
        void maxAge3600() {
            assertThat(corsConfig.getMaxAge()).isEqualTo(3600L);
        }

        @Test
        @DisplayName("config is registered for all paths (/**)")
        void registeredForAllPaths() throws Exception {
            UrlBasedCorsConfigurationSource source = invokeCorsConfigSource();
            assertThat(source.getCorsConfigurations()).containsKey("/**");
        }

        @Test
        @DisplayName("only one path pattern is registered")
        void singlePathPattern() throws Exception {
            UrlBasedCorsConfigurationSource source = invokeCorsConfigSource();
            assertThat(source.getCorsConfigurations()).hasSize(1);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  corsFilter() bean
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("corsFilter()")
    class CorsFilterBeanTests {

        @Test
        @DisplayName("returns a non-null CorsFilter")
        void returnsNonNull() {
            CorsFilter filter = config.corsFilter();
            assertThat(filter).isNotNull();
        }

        @Test
        @DisplayName("returns an instance of CorsFilter")
        void returnsCorrectType() {
            assertThat(config.corsFilter()).isInstanceOf(CorsFilter.class);
        }

        @Test
        @DisplayName("each call creates a new CorsFilter instance")
        void newInstanceEachCall() {
            CorsFilter f1 = config.corsFilter();
            CorsFilter f2 = config.corsFilter();
            assertThat(f1).isNotSameAs(f2);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Annotation verification
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Annotations")
    class Annotations {

        @Test
        @DisplayName("class is @Configuration")
        void isConfiguration() {
            assertThat(WebSecurityConfig.class.getAnnotation(Configuration.class))
                    .isNotNull();
        }

        @Test
        @DisplayName("class is @EnableWebSecurity")
        void isEnableWebSecurity() {
            assertThat(WebSecurityConfig.class.getAnnotation(EnableWebSecurity.class))
                    .isNotNull();
        }

        @Test
        @DisplayName("restApiSecurityFilterChain is a @Bean")
        void filterChainIsBean() throws Exception {
            Method m = WebSecurityConfig.class.getMethod(
                    "restApiSecurityFilterChain",
                    org.springframework.security.config.annotation.web.builders.HttpSecurity.class);
            assertThat(m.getAnnotation(Bean.class)).isNotNull();
        }

        @Test
        @DisplayName("restApiSecurityFilterChain has @Order(1)")
        void filterChainIsOrder1() throws Exception {
            Method m = WebSecurityConfig.class.getMethod(
                    "restApiSecurityFilterChain",
                    org.springframework.security.config.annotation.web.builders.HttpSecurity.class);
            Order order = m.getAnnotation(Order.class);
            assertThat(order).isNotNull();
            assertThat(order.value()).isEqualTo(1);
        }

        @Test
        @DisplayName("corsFilter is a @Bean")
        void corsFilterIsBean() throws Exception {
            Method m = WebSecurityConfig.class.getMethod("corsFilter");
            assertThat(m.getAnnotation(Bean.class)).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Reflection helper
    // ══════════════════════════════════════════════════════════════════════════

    private UrlBasedCorsConfigurationSource invokeCorsConfigSource() throws Exception {
        Method method = WebSecurityConfig.class.getDeclaredMethod("corsConfigurationSource");
        method.setAccessible(true);
        return (UrlBasedCorsConfigurationSource) method.invoke(config);
    }
}
