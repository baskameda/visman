package eu.poc.claude.delegate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SillyBlacklistChecker}.
 *
 * Source file: 37 lines, single execute() method.
 * Target: 100 % line + branch coverage.
 *
 * <p>Contract under test:
 * <ul>
 *   <li>Reads {@code VName} from the execution context (for logging)</li>
 *   <li>Always sets {@code reliability = 70L} – everyone passes in the POC</li>
 *   <li>The downstream BPMN gateway branches on {@code reliability <= 30}</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SillyBlacklistChecker")
class SillyBlacklistCheckerTest {

    private SillyBlacklistChecker checker;

    @Mock
    private DelegateExecution execution;

    @BeforeEach
    void setUp() {
        checker = new SillyBlacklistChecker();
    }

    // ── Interface contract ────────────────────────────────────────────────────

    @Test
    @DisplayName("implements JavaDelegate")
    void implementsJavaDelegate() {
        assertThat(checker).isInstanceOf(JavaDelegate.class);
    }

    // ── Core logic ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("sets reliability to exactly 70")
    void setsReliabilityTo70() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Alice");

        checker.execute(execution);

        verify(execution).setVariable("reliability", 70L);
    }

    @Test
    @DisplayName("reads VName for logging purposes")
    void readsVNameVariable() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Bob");

        checker.execute(execution);

        verify(execution).getVariable("VName");
    }

    @Test
    @DisplayName("modifies only the reliability variable — nothing else")
    void setsExactlyOneVariable() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");

        checker.execute(execution);

        // Only one setVariable call
        verify(execution, times(1)).setVariable(anyString(), any());
    }

    // ── Edge-case inputs ──────────────────────────────────────────────────────

    @ParameterizedTest(name = "visitor name = \"{0}\"")
    @ValueSource(strings = {
        "Alice",                   // simple ASCII
        "Ñoño García",             // Latin-extended
        "이영희",                    // Korean
        "محمد عبدالله",             // Arabic
        "",                        // empty string
        "  ",                      // whitespace
        "A very long visitor name that exceeds any reasonable field length limit "
            + "and should still not break the delegate logic in any way whatsoever"
    })
    @DisplayName("always sets reliability=70 regardless of visitor name")
    void acceptsAnyVisitorName(String name) throws Exception {
        when(execution.getVariable("VName")).thenReturn(name);

        checker.execute(execution);

        verify(execution).setVariable("reliability", 70L);
    }

    @ParameterizedTest
    @NullSource
    @DisplayName("handles null VName without throwing")
    void handlesNullName(String name) throws Exception {
        when(execution.getVariable("VName")).thenReturn(name);

        assertThatCode(() -> checker.execute(execution)).doesNotThrowAnyException();
        verify(execution).setVariable("reliability", 70L);
    }

    // ── Business-rule verification ────────────────────────────────────────────

    @Test
    @DisplayName("reliability of 70 passes the BPMN >30 gateway")
    void reliabilityPassesDownstreamGateway() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");

        checker.execute(execution);

        ArgumentCaptor<Long> captor = ArgumentCaptor.forClass(Long.class);
        verify(execution).setVariable(eq("reliability"), captor.capture());
        assertThat(captor.getValue())
                .as("reliability > 30 → visitor is NOT blacklisted → process continues")
                .isGreaterThan(30L);
    }

    @Test
    @DisplayName("reliability is within the valid [0, 100] range")
    void reliabilityInValidRange() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");

        checker.execute(execution);

        ArgumentCaptor<Long> captor = ArgumentCaptor.forClass(Long.class);
        verify(execution).setVariable(eq("reliability"), captor.capture());
        assertThat(captor.getValue()).isBetween(0L, 100L);
    }

    @Test
    @DisplayName("reliability is of type Long (not Integer)")
    void reliabilityIsLong() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");

        checker.execute(execution);

        // Verify the exact type: the production code uses 70L (long literal)
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(execution).setVariable(eq("reliability"), captor.capture());
        assertThat(captor.getValue()).isInstanceOf(Long.class);
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("is idempotent — calling execute twice produces same result")
    void isIdempotent() throws Exception {
        when(execution.getVariable("VName")).thenReturn("Test");

        checker.execute(execution);
        checker.execute(execution);

        verify(execution, times(2)).setVariable("reliability", 70L);
    }
}
