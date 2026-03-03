package eu.poc.claude.config;

import org.operaton.bpm.engine.IdentityService;
import org.operaton.bpm.engine.identity.Group;
import org.operaton.bpm.engine.identity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Creates the required groups and demo users in Operaton on first startup.
 *
 * Groups derived from the BPMN candidateGroups:
 *   Invitors, Security, Porters
 *
 * Admin group:
 *   webAdmins – members of this group can access the Admin dashboard.
 *   The built-in "admin" user is added here on every startup so it always
 *   has access, even before any "Superhero" admin is created via the UI.
 */
@Component
public class OperatonInitializerConfig {

    private static final Logger log = LoggerFactory.getLogger(OperatonInitializerConfig.class);

    private final IdentityService identityService;

    private static final String GROUP_INVITORS   = "Invitors";
    private static final String GROUP_SECURITY   = "Security";
    private static final String GROUP_PORTERS    = "Porters";
    private static final String GROUP_WEB_ADMINS = "webAdmins";

    public OperatonInitializerConfig(IdentityService identityService) {
        this.identityService = identityService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initGroupsAndUsers() {
        log.info("Initializing Operaton groups and demo users...");

        // ── BPMN process groups ───────────────────────────────────────────────
        createGroupIfAbsent(GROUP_INVITORS,   "Inviters – staff who send visitor invitations");
        createGroupIfAbsent(GROUP_SECURITY,   "Security – staff who run background checks");
        createGroupIfAbsent(GROUP_PORTERS,    "Porters – gate keepers who allow physical entry");

        // ── Admin UI group ────────────────────────────────────────────────────
        createGroupIfAbsent(GROUP_WEB_ADMINS, "Web Admins – users who can access the Admin dashboard");

        // ── Demo users ────────────────────────────────────────────────────────
        createUserIfAbsent("inviter1",    "Alice", "Inviter",    "inviter123",  GROUP_INVITORS);
        createUserIfAbsent("security1",   "Bob",   "Security",   "security123", GROUP_SECURITY);
        createUserIfAbsent("gatekeeper1", "Carol", "Gatekeeper", "porter123",   GROUP_PORTERS);

        // ── Ensure the built-in admin is always in webAdmins ─────────────────
        ensureMembership("admin", GROUP_WEB_ADMINS);

        log.info("Operaton initialization complete.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void createGroupIfAbsent(String id, String name) {
        if (identityService.createGroupQuery().groupId(id).count() == 0) {
            Group group = identityService.newGroup(id);
            group.setName(name);
            group.setType("WORKFLOW");
            identityService.saveGroup(group);
            log.info("Created group: {}", id);
        } else {
            log.debug("Group already exists: {}", id);
        }
    }

    private void createUserIfAbsent(String id, String firstName, String lastName,
                                    String password, String groupId) {
        if (identityService.createUserQuery().userId(id).count() == 0) {
            User user = identityService.newUser(id);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPassword(password);
            user.setEmail(id + "@visitor-poc.local");
            identityService.saveUser(user);
            identityService.createMembership(id, groupId);
            log.info("Created user '{}' in group '{}'", id, groupId);
        } else {
            log.debug("User already exists: {}", id);
        }
    }

    /**
     * Adds userId to groupId only if the membership does not already exist.
     * Uses a membership query to avoid duplicate-key errors.
     */
    private void ensureMembership(String userId, String groupId) {
        boolean alreadyMember = identityService.createUserQuery()
                .userId(userId)
                .memberOfGroup(groupId)
                .count() > 0;
        if (!alreadyMember) {
            identityService.createMembership(userId, groupId);
            log.info("Added user '{}' to group '{}'", userId, groupId);
        } else {
            log.debug("User '{}' already in group '{}'", userId, groupId);
        }
    }
}
