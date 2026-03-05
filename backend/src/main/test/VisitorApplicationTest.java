package eu.poc.claude;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link VisitorApplication}.
 *
 * Source file: 12 lines. The Spring Boot entry point.
 * We verify annotations and the main method signature without actually
 * bootstrapping the entire Spring context (that would be an integration test).
 *
 * Target: 100 % of testable code (annotation + main method existence).
 */
@DisplayName("VisitorApplication")
class VisitorApplicationTest {

    @Test
    @DisplayName("class is annotated with @SpringBootApplication")
    void isSpringBootApplication() {
        assertThat(VisitorApplication.class.getAnnotation(SpringBootApplication.class))
                .isNotNull();
    }

    @Test
    @DisplayName("main method exists and is public static void")
    void mainMethodSignature() throws Exception {
        Method main = VisitorApplication.class.getMethod("main", String[].class);
        assertThat(Modifier.isPublic(main.getModifiers())).isTrue();
        assertThat(Modifier.isStatic(main.getModifiers())).isTrue();
        assertThat(main.getReturnType()).isEqualTo(void.class);
    }

    @Test
    @DisplayName("main method accepts String[] parameter")
    void mainMethodParameter() throws Exception {
        Method main = VisitorApplication.class.getMethod("main", String[].class);
        assertThat(main.getParameterCount()).isEqualTo(1);
        assertThat(main.getParameterTypes()[0]).isEqualTo(String[].class);
    }

    @Test
    @DisplayName("class is in the expected root package eu.poc.claude")
    void correctPackage() {
        assertThat(VisitorApplication.class.getPackageName())
                .isEqualTo("eu.poc.claude");
    }
}
