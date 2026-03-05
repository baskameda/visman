package eu.poc.claude.delegate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SillyCheckinService}.
 *
 * Source file: 40 lines, single execute() method.
 * Target: 100 % line + branch coverage.
 *
 * <p>Contract under test:
 * <ul>
 *   <li>Reads VName, VDate, AVDate, reliability, processInstanceId (all for logging)</li>
 *   <li>Sets {@code checkedIn = true} — the single side-effect</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SillyCheckinService")
class SillyCheckinServiceTest {

    private SillyCheckinService service;

    @Mock
    private DelegateExecution execution;

    @BeforeEach
    void setUp() {
        service = new SillyCheckinService();
    }

    // ── Interface contract ────────────────────────────────────────────────────

    @Test
    @DisplayName("implements JavaDelegate")
    void implementsJavaDelegate() {
        assertThat(service).isInstanceOf(JavaDelegate.class);
    }

    // ── Core side-effect ──────────────────────────────────────────────────────

    @Test
    @DisplayName("sets checkedIn = true")
    void setsCheckedInTrue() throws Exception {
        stubAllVariables("Alice", "2025-06-01", "2025-06-01", 70L, "proc-1");

        service.execute(execution);

        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("sets exactly one process variable (checkedIn)")
    void setsExactlyOneVariable() throws Exception {
        stubAllVariables("Bob", "2025-06-01", "2025-06-02", 80L, "proc-2");

        service.execute(execution);

        verify(execution, times(1)).setVariable(anyString(), any());
    }

    @Test
    @DisplayName("checkedIn value is Boolean true, not a truthy substitute")
    void checkedInIsBooleanTrue() throws Exception {
        stubAllVariables("Test", "2025-01-01", "2025-01-01", 70L, "proc-3");

        service.execute(execution);

        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(execution).setVariable(eq("checkedIn"), captor.capture());
        assertThat(captor.getValue())
                .isInstanceOf(Boolean.class)
                .isEqualTo(true);
    }

    // ── Variable reads — each line 23-26 + line 34 ────────────────────────────

    @Test
    @DisplayName("reads VName (line 23)")
    void readsVName() throws Exception {
        stubAllVariables("Carol", "2025-01-01", "2025-01-01", 70L, "proc-4");

        service.execute(execution);

        verify(execution).getVariable("VName");
    }

    @Test
    @DisplayName("reads VDate (line 24)")
    void readsVDate() throws Exception {
        stubAllVariables("Dave", "2025-03-15", "2025-03-15", 70L, "proc-5");

        service.execute(execution);

        verify(execution).getVariable("VDate");
    }

    @Test
    @DisplayName("reads AVDate (line 25)")
    void readsAVDate() throws Exception {
        stubAllVariables("Eve", "2025-04-01", "2025-04-02", 70L, "proc-6");

        service.execute(execution);

        verify(execution).getVariable("AVDate");
    }

    @Test
    @DisplayName("reads reliability (line 26)")
    void readsReliability() throws Exception {
        stubAllVariables("Frank", "2025-05-10", "2025-05-10", 90L, "proc-7");

        service.execute(execution);

        verify(execution).getVariable("reliability");
    }

    @Test
    @DisplayName("reads processInstanceId (line 34)")
    void readsProcessInstanceId() throws Exception {
        stubAllVariables("Grace", "2025-06-01", "2025-06-01", 70L, "proc-8");

        service.execute(execution);

        verify(execution).getProcessInstanceId();
    }

    // ── Null safety — every variable may be null ──────────────────────────────

    @Test
    @DisplayName("handles null VName without throwing")
    void handlesNullVName() throws Exception {
        stubAllVariables(null, "2025-01-01", "2025-01-01", 70L, "proc-null-name");

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("handles null VDate without throwing")
    void handlesNullVDate() throws Exception {
        stubAllVariables("Test", null, "2025-01-01", 70L, "proc-null-vdate");

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("handles null AVDate without throwing")
    void handlesNullAVDate() throws Exception {
        stubAllVariables("Test", "2025-01-01", null, 70L, "proc-null-avdate");

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("handles null reliability without throwing")
    void handlesNullReliability() throws Exception {
        stubAllVariables("Test", "2025-01-01", "2025-01-01", null, "proc-null-rel");

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("handles null processInstanceId without throwing")
    void handlesNullProcessId() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");
        when(execution.getVariable("VDate")).thenReturn("2025-01-01");
        when(execution.getVariable("AVDate")).thenReturn("2025-01-01");
        when(execution.getVariable("reliability")).thenReturn(70L);
        when(execution.getProcessInstanceId()).thenReturn(null);

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("handles ALL variables null without throwing")
    void handlesAllNull() throws Exception {
        when(execution.getVariable(anyString())).thenReturn(null);
        when(execution.getProcessInstanceId()).thenReturn(null);

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    // ── Various data types that may arrive at runtime ─────────────────────────

    @Test
    @DisplayName("accepts Integer reliability (Operaton may return Integer instead of Long)")
    void acceptsIntegerReliability() throws Exception {
        stubAllVariables("Test", "2025-01-01", "2025-01-01", 70, "proc-int-rel");

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    @Test
    @DisplayName("accepts Date objects for VDate/AVDate")
    void acceptsDateObjects() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");
        when(execution.getVariable("VDate")).thenReturn(new java.util.Date());
        when(execution.getVariable("AVDate")).thenReturn(new java.util.Date());
        when(execution.getVariable("reliability")).thenReturn(70L);
        when(execution.getProcessInstanceId()).thenReturn("proc-date-obj");

        assertThatCode(() -> service.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("checkedIn", true);
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("is idempotent — calling execute twice sets checkedIn both times")
    void isIdempotent() throws Exception {
        stubAllVariables("Test", "2025-01-01", "2025-01-01", 70L, "proc-idem");

        service.execute(execution);
        service.execute(execution);

        verify(execution, times(2)).setVariable("checkedIn", true);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void stubAllVariables(String vName, Object vDate, Object avDate,
                                  Object reliability, String processId) {
        when(execution.getVariable("VName")).thenReturn(vName);
        when(execution.getVariable("VDate")).thenReturn(vDate);
        when(execution.getVariable("AVDate")).thenReturn(avDate);
        when(execution.getVariable("reliability")).thenReturn(reliability);
        when(execution.getProcessInstanceId()).thenReturn(processId);
    }
}
