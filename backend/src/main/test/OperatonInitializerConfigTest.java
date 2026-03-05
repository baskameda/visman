package eu.poc.claude.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.operaton.bpm.engine.IdentityService;
import org.operaton.bpm.engine.identity.Group;
import org.operaton.bpm.engine.identity.GroupQuery;
import org.operaton.bpm.engine.identity.User;
import org.operaton.bpm.engine.identity.UserQuery;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link OperatonInitializerConfig}.
 *
 * Source file: 108 lines. Tests the startup initializer that seeds
 * 4 groups, 3 demo users, and the admin → webAdmins membership.
 *
 * <p>Private methods and branches:
 * <ul>
 *   <li>{@code createGroupIfAbsent} — branch: count==0 vs count&gt;0</li>
 *   <li>{@code createUserIfAbsent}  — branch: count==0 vs count&gt;0</li>
 *   <li>{@code ensureMembership}    — branch: !member vs already member</li>
 * </ul>
 * Target: 100 % line + branch coverage.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OperatonInitializerConfig")
class OperatonInitializerConfigTest {

    private OperatonInitializerConfig config;

    @Mock private IdentityService identityService;
    @Mock private GroupQuery groupQuery;
    @Mock private UserQuery userQuery;
    @Mock private Group mockGroup;
    @Mock private User  mockUser;

    @BeforeEach
    void setUp() {
        config = new OperatonInitializerConfig(identityService);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Scenario 1: FRESH INSTALL — nothing exists yet
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Fresh install (no groups, no users)")
    class FreshInstall {

        @BeforeEach
        void stubFreshState() {
            // All group queries return count=0
            when(identityService.createGroupQuery()).thenReturn(groupQuery);
            when(groupQuery.groupId(anyString())).thenReturn(groupQuery);
            when(groupQuery.count()).thenReturn(0L);
            when(identityService.newGroup(anyString())).thenReturn(mockGroup);

            // All user queries return count=0
            when(identityService.createUserQuery()).thenReturn(userQuery);
            when(userQuery.userId(anyString())).thenReturn(userQuery);
            when(userQuery.memberOfGroup(anyString())).thenReturn(userQuery);
            when(userQuery.count()).thenReturn(0L);
            when(identityService.newUser(anyString())).thenReturn(mockUser);
        }

        @Test
        @DisplayName("creates all 4 groups")
        void creates4Groups() {
            config.initGroupsAndUsers();

            verify(identityService, times(4)).saveGroup(any(Group.class));
        }

        @Test
        @DisplayName("creates Invitors group")
        void createsInvitors() {
            config.initGroupsAndUsers();

            verify(identityService).newGroup("Invitors");
        }

        @Test
        @DisplayName("creates Security group")
        void createsSecurity() {
            config.initGroupsAndUsers();

            verify(identityService).newGroup("Security");
        }

        @Test
        @DisplayName("creates Porters group")
        void createsPorters() {
            config.initGroupsAndUsers();

            verify(identityService).newGroup("Porters");
        }

        @Test
        @DisplayName("creates webAdmins group")
        void createsWebAdmins() {
            config.initGroupsAndUsers();

            verify(identityService).newGroup("webAdmins");
        }

        @Test
        @DisplayName("all groups are created with type WORKFLOW")
        void groupTypeIsWorkflow() {
            config.initGroupsAndUsers();

            verify(mockGroup, times(4)).setType("WORKFLOW");
        }

        @Test
        @DisplayName("group names include descriptive text")
        void groupNamesAreDescriptive() {
            config.initGroupsAndUsers();

            // Verify setName was called with each description
            ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
            verify(mockGroup, times(4)).setName(captor.capture());
            List<String> names = captor.getAllValues();
            assertThat(names).anyMatch(n -> n.contains("Inviters"));
            assertThat(names).anyMatch(n -> n.contains("Security"));
            assertThat(names).anyMatch(n -> n.contains("gate keepers"));
            assertThat(names).anyMatch(n -> n.contains("Admin"));
        }

        @Test
        @DisplayName("creates all 3 demo users")
        void creates3Users() {
            config.initGroupsAndUsers();

            verify(identityService, times(3)).saveUser(any(User.class));
        }

        @Test
        @DisplayName("creates inviter1 user")
        void createsInviter1() {
            config.initGroupsAndUsers();

            verify(identityService).newUser("inviter1");
        }

        @Test
        @DisplayName("creates security1 user")
        void createsSecurity1() {
            config.initGroupsAndUsers();

            verify(identityService).newUser("security1");
        }

        @Test
        @DisplayName("creates gatekeeper1 user")
        void createsGatekeeper1() {
            config.initGroupsAndUsers();

            verify(identityService).newUser("gatekeeper1");
        }

        @Test
        @DisplayName("sets firstName for each demo user")
        void setsFirstNames() {
            config.initGroupsAndUsers();

            ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
            verify(mockUser, times(3)).setFirstName(captor.capture());
            assertThat(captor.getAllValues()).containsExactly("Alice", "Bob", "Carol");
        }

        @Test
        @DisplayName("sets lastName for each demo user")
        void setsLastNames() {
            config.initGroupsAndUsers();

            ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
            verify(mockUser, times(3)).setLastName(captor.capture());
            assertThat(captor.getAllValues()).containsExactly("Inviter", "Security", "Gatekeeper");
        }

        @Test
        @DisplayName("sets passwords for each demo user")
        void setsPasswords() {
            config.initGroupsAndUsers();

            ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
            verify(mockUser, times(3)).setPassword(captor.capture());
            assertThat(captor.getAllValues()).containsExactly("inviter123", "security123", "porter123");
        }

        @Test
        @DisplayName("sets email in the format id@visitor-poc.local")
        void setsEmails() {
            config.initGroupsAndUsers();

            ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
            verify(mockUser, times(3)).setEmail(captor.capture());
            assertThat(captor.getAllValues()).containsExactly(
                    "inviter1@visitor-poc.local",
                    "security1@visitor-poc.local",
                    "gatekeeper1@visitor-poc.local"
            );
        }

        @Test
        @DisplayName("adds each user to their respective group")
        void createsUserGroupMemberships() {
            config.initGroupsAndUsers();

            verify(identityService).createMembership("inviter1", "Invitors");
            verify(identityService).createMembership("security1", "Security");
            verify(identityService).createMembership("gatekeeper1", "Porters");
        }

        @Test
        @DisplayName("adds built-in admin to webAdmins")
        void addsAdminToWebAdmins() {
            config.initGroupsAndUsers();

            verify(identityService).createMembership("admin", "webAdmins");
        }

        @Test
        @DisplayName("total of 4 memberships created (3 demo + 1 admin)")
        void totalMembershipsCreated() {
            config.initGroupsAndUsers();

            // inviter1→Invitors, security1→Security, gatekeeper1→Porters, admin→webAdmins
            verify(identityService, times(4)).createMembership(anyString(), anyString());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Scenario 2: EVERYTHING EXISTS — idempotent re-run
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Re-run (all groups, users, and membership already exist)")
    class EverythingExists {

        @BeforeEach
        void stubAllExist() {
            // Groups: count > 0 → already exist
            when(identityService.createGroupQuery()).thenReturn(groupQuery);
            when(groupQuery.groupId(anyString())).thenReturn(groupQuery);
            when(groupQuery.count()).thenReturn(1L);

            // Users: count > 0 → already exist;  admin already in webAdmins
            when(identityService.createUserQuery()).thenReturn(userQuery);
            when(userQuery.userId(anyString())).thenReturn(userQuery);
            when(userQuery.memberOfGroup(anyString())).thenReturn(userQuery);
            when(userQuery.count()).thenReturn(1L);
        }

        @Test
        @DisplayName("does NOT create any groups")
        void noGroupsCreated() {
            config.initGroupsAndUsers();

            verify(identityService, never()).saveGroup(any(Group.class));
            verify(identityService, never()).newGroup(anyString());
        }

        @Test
        @DisplayName("does NOT create any users")
        void noUsersCreated() {
            config.initGroupsAndUsers();

            verify(identityService, never()).saveUser(any(User.class));
            verify(identityService, never()).newUser(anyString());
        }

        @Test
        @DisplayName("does NOT create any memberships (admin is already in webAdmins)")
        void noMembershipsCreated() {
            config.initGroupsAndUsers();

            verify(identityService, never()).createMembership(anyString(), anyString());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Scenario 3: Groups exist, users are new — covers mixed branches
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Groups exist, users are new, admin not yet in webAdmins")
    class GroupsExistUsersNew {

        @BeforeEach
        void stubMixed() {
            // Groups already exist
            when(identityService.createGroupQuery()).thenReturn(groupQuery);
            when(groupQuery.groupId(anyString())).thenReturn(groupQuery);
            when(groupQuery.count()).thenReturn(1L);

            // Users don't exist; admin not in webAdmins
            when(identityService.createUserQuery()).thenReturn(userQuery);
            when(userQuery.userId(anyString())).thenReturn(userQuery);
            when(userQuery.memberOfGroup(anyString())).thenReturn(userQuery);
            when(userQuery.count()).thenReturn(0L);  // users absent + admin not member
            when(identityService.newUser(anyString())).thenReturn(mockUser);
        }

        @Test
        @DisplayName("skips group creation but creates users")
        void skipsGroupsCreatesUsers() {
            config.initGroupsAndUsers();

            verify(identityService, never()).saveGroup(any());
            verify(identityService, times(3)).saveUser(any(User.class));
        }

        @Test
        @DisplayName("creates user-group memberships and admin membership")
        void createsMemberships() {
            config.initGroupsAndUsers();

            verify(identityService).createMembership("inviter1", "Invitors");
            verify(identityService).createMembership("security1", "Security");
            verify(identityService).createMembership("gatekeeper1", "Porters");
            verify(identityService).createMembership("admin", "webAdmins");
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Scenario 4: Everything exists but admin NOT in webAdmins
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("All exist except admin not in webAdmins")
    class AdminNotInGroup {

        @BeforeEach
        void stub() {
            when(identityService.createGroupQuery()).thenReturn(groupQuery);
            when(groupQuery.groupId(anyString())).thenReturn(groupQuery);
            when(groupQuery.count()).thenReturn(1L);

            // Users exist (count=1), but admin membership returns 0
            // createUserQuery is called for user checks (3×) and ensureMembership (1×)
            // Users are checked with userId().count(), membership with userId().memberOfGroup().count()
            // Since we can't distinguish the query chain, we use a tracking counter
            when(identityService.createUserQuery()).thenReturn(userQuery);
            when(userQuery.userId(anyString())).thenReturn(userQuery);
            when(userQuery.memberOfGroup(anyString())).thenReturn(userQuery);
            // First 3 calls: user existence check → 1 (exists)
            // 4th call: membership check → 0 (not member)
            when(userQuery.count()).thenReturn(1L, 1L, 1L, 0L);
        }

        @Test
        @DisplayName("adds admin to webAdmins even when users exist")
        void addsAdminMembership() {
            config.initGroupsAndUsers();

            verify(identityService).createMembership("admin", "webAdmins");
        }

        @Test
        @DisplayName("does not re-create existing users")
        void doesNotRecreateUsers() {
            config.initGroupsAndUsers();

            verify(identityService, never()).saveUser(any());
        }

        @Test
        @DisplayName("only the admin membership is created (no user memberships)")
        void onlyAdminMembership() {
            config.initGroupsAndUsers();

            // Only admin→webAdmins
            verify(identityService, times(1)).createMembership(anyString(), anyString());
            verify(identityService).createMembership("admin", "webAdmins");
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Annotation & constructor verification
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("class is annotated with @Component")
    void isComponent() {
        assertThat(OperatonInitializerConfig.class
                .getAnnotation(org.springframework.stereotype.Component.class))
                .isNotNull();
    }

    @Test
    @DisplayName("initGroupsAndUsers is @EventListener for ApplicationReadyEvent")
    void listensToApplicationReady() throws Exception {
        var method = OperatonInitializerConfig.class.getMethod("initGroupsAndUsers");
        var listener = method.getAnnotation(
                org.springframework.context.event.EventListener.class);
        assertThat(listener).isNotNull();
        assertThat(listener.value()).contains(
                org.springframework.boot.context.event.ApplicationReadyEvent.class);
    }
}
