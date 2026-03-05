package eu.poc.claude.sse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SseController}.
 *
 * Source file: 33 lines. A thin REST layer delegating to TaskEventService.
 * Target: 100 % line + branch coverage.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SseController")
class SseControllerTest {

    private SseController controller;

    @Mock
    private TaskEventService taskEventService;

    @BeforeEach
    void setUp() {
        controller = new SseController(taskEventService);
    }

    // ── Delegation ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("subscribeToTaskUpdates delegates to TaskEventService.subscribe()")
    void delegatesToService() {
        SseEmitter expected = new SseEmitter();
        when(taskEventService.subscribe()).thenReturn(expected);

        SseEmitter result = controller.subscribeToTaskUpdates();

        verify(taskEventService).subscribe();
        assertThat(result).isSameAs(expected);
    }

    @Test
    @DisplayName("returns the exact emitter from the service (no wrapping)")
    void returnsExactEmitter() {
        SseEmitter emitter = new SseEmitter(5000L);
        when(taskEventService.subscribe()).thenReturn(emitter);

        assertThat(controller.subscribeToTaskUpdates()).isSameAs(emitter);
    }

    @Test
    @DisplayName("each invocation creates a new subscription")
    void eachInvocationCreatesNewSubscription() {
        SseEmitter e1 = new SseEmitter();
        SseEmitter e2 = new SseEmitter();
        when(taskEventService.subscribe()).thenReturn(e1).thenReturn(e2);

        SseEmitter r1 = controller.subscribeToTaskUpdates();
        SseEmitter r2 = controller.subscribeToTaskUpdates();

        assertThat(r1).isNotSameAs(r2);
        verify(taskEventService, times(2)).subscribe();
    }

    // ── Annotation verification ───────────────────────────────────────────────

    @Test
    @DisplayName("class is annotated with @RestController")
    void isRestController() {
        assertThat(SseController.class.getAnnotation(RestController.class)).isNotNull();
    }

    @Test
    @DisplayName("class is mapped to /api/sse")
    void classMappedToApiSse() {
        RequestMapping mapping = SseController.class.getAnnotation(RequestMapping.class);
        assertThat(mapping).isNotNull();
        assertThat(mapping.value()).containsExactly("/api/sse");
    }

    @Test
    @DisplayName("class has @CrossOrigin for localhost:5173 and localhost:3000")
    void crossOriginConfigured() {
        CrossOrigin cors = SseController.class.getAnnotation(CrossOrigin.class);
        assertThat(cors).isNotNull();
        assertThat(cors.origins()).containsExactlyInAnyOrder(
                "http://localhost:5173",
                "http://localhost:3000"
        );
    }

    @Test
    @DisplayName("subscribeToTaskUpdates is a GET /tasks producing TEXT_EVENT_STREAM")
    void endpointAnnotations() throws Exception {
        Method method = SseController.class.getMethod("subscribeToTaskUpdates");
        GetMapping get = method.getAnnotation(GetMapping.class);
        assertThat(get).isNotNull();
        assertThat(get.value()).containsExactly("/tasks");
        assertThat(get.produces()).containsExactly(MediaType.TEXT_EVENT_STREAM_VALUE);
    }
}
