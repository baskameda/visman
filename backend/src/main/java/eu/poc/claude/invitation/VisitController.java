package eu.poc.claude.invitation;

import eu.poc.claude.entrance.EntranceRepository;
import org.operaton.bpm.engine.IdentityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitRepository                visitRepo;
    private final EntranceRepository             entranceRepo;
    private final GatekeeperSupervisorRepository gatekeeperSupervisorRepo;
    private final IdentityService                identityService;

    public VisitController(VisitRepository visitRepo,
                           EntranceRepository entranceRepo,
                           GatekeeperSupervisorRepository gatekeeperSupervisorRepo,
                           IdentityService identityService) {
        this.visitRepo                = visitRepo;
        this.entranceRepo             = entranceRepo;
        this.gatekeeperSupervisorRepo = gatekeeperSupervisorRepo;
        this.identityService          = identityService;
    }

    // ── GET /api/visits/my ────────────────────────────────────────────────────

    /**
     * Returns all visits for the entrances this gatekeeper is assigned to.
     * If the gatekeeper has no entrances, returns an empty list.
     */
    @GetMapping("/my")
    public List<Visit> myVisits(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        String username = requireUsername(authHeader);
        List<Long> entranceIds = entranceRepo.findByGatekeeper(username)
                                             .stream().map(e -> e.getId()).toList();
        if (from != null && to != null) {
            return visitRepo.findByEntrancesAndDateRange(
                entranceIds, LocalDate.parse(from), LocalDate.parse(to));
        }
        return visitRepo.findByEntrances(entranceIds);
    }

    // ── GET /api/visits/my/date-index ─────────────────────────────────────────

    /**
     * Lightweight endpoint: returns visit counts grouped by date.
     * Used by the gatekeeper dashboard to build the month/week accordion
     * without loading full visit data upfront.
     */
    @GetMapping("/my/date-index")
    public List<VisitRepository.DateCount> myDateIndex(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);
        List<Long> entranceIds = entranceRepo.findByGatekeeper(username)
                                             .stream().map(e -> e.getId()).toList();
        return visitRepo.findDateIndexByEntrances(entranceIds);
    }

    // ── GET /api/visits/supervisees ───────────────────────────────────────────

    /**
     * Returns all visits for the entrances assigned to the supervisor's supervisees.
     * Only accessible to gatekeeper supervisors.
     */
    @GetMapping("/supervisees")
    public List<Visit> superviseeVisits(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);
        if (!gatekeeperSupervisorRepo.isSupervisor(username))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a gatekeeper supervisor");

        List<String> supervisees = gatekeeperSupervisorRepo.findSupervisees(username);

        // Build tagged list: each visit carries the supervisee who is responsible for its entrance
        List<Visit> result = new java.util.ArrayList<>();
        for (String supervisee : supervisees) {
            List<Long> entranceIds = entranceRepo.findByGatekeeper(supervisee)
                .stream().map(e -> e.getId()).toList();
            List<Visit> visits = visitRepo.findByEntrances(entranceIds);
            visits.forEach(v -> v.setResponsibleGatekeeper(supervisee));
            result.addAll(visits);
        }
        return result;
    }

    // ── GET /api/visits/stats/checkins-per-entrance-day ──────────────────────

    /**
     * Admin-only: returns check-in counts grouped by entrance and day
     * for the last N days (default 30, max 365).
     */
    @GetMapping("/stats/checkins-per-entrance-day")
    public List<VisitRepository.EntranceDayCount> checkinsPerEntranceDay(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) Long locationId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (days < 1 || days > 365) days = 30;
        return visitRepo.countCheckinsByEntranceAndDay(days, locationId);
    }

    // ── GET /api/visits/my-checkins ───────────────────────────────────────────

    /**
     * Returns all visits that were checked in by the current gatekeeper.
     * Used for historical stats / gamification panel.
     */
    @GetMapping("/my-checkins")
    public List<Visit> myCheckins(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        return visitRepo.findByCheckedInBy(username);
    }

    // ── PUT /api/visits/{id}/checkin ──────────────────────────────────────────

    record CheckinRequest(Double latitude, Double longitude, String checkinTime) {}

    @PutMapping("/{id}/checkin")
    public ResponseEntity<Void> checkIn(
            @PathVariable long id,
            @RequestBody(required = false) CheckinRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);

        visitRepo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit " + id + " not found"));

        // Parse optional offline checkin timestamp (ISO-8601, e.g. "2026-03-06T10:30:00.000Z")
        LocalDateTime checkinAt = null;
        if (req != null && req.checkinTime() != null) {
            try {
                String t = req.checkinTime();
                if (t.length() > 19) t = t.substring(0, 19); // strip millis and Z
                checkinAt = LocalDateTime.parse(t);
            } catch (Exception ignored) {}
        }

        boolean updated = visitRepo.checkIn(
            id, username,
            req != null ? req.latitude()  : null,
            req != null ? req.longitude() : null,
            checkinAt);

        if (!updated) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Visit " + id + " cannot be checked in (already checked in or no-show)");
        }

        return ResponseEntity.noContent().build();
    }

    // ── GET /api/visits/{id} ──────────────────────────────────────────────────

    @GetMapping("/{id}")
    public Visit getById(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        return visitRepo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit " + id + " not found"));
    }

    // ── GET /api/visits/stats/sankey ──────────────────────────────────────────

    record SankeyNode(String id, String name, String group) {}
    record SankeyLink(String source, String target, int value) {}
    record SankeyResponse(List<SankeyNode> nodes, List<SankeyLink> links,
                          List<VisitRepository.RefusedRow> refused) {}

    /**
     * Admin-only: returns Sankey graph data for the approved check-in flow
     * Inviter → Security Officer → Gatekeeper → Entrance.
     * Also returns refused/blacklisted counts as a separate summary.
     */
    @GetMapping("/stats/sankey")
    public SankeyResponse sankey(
            @RequestParam(defaultValue = "90") int days,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (days < 7 || days > 365) days = 90;

        List<VisitRepository.SankeyRow> rows    = visitRepo.getSankeyRows(days);
        List<VisitRepository.RefusedRow> refused = visitRepo.getRefusedSummary(days);

        // Collect unique nodes per group preserving insertion order
        LinkedHashSet<String> inviters    = new LinkedHashSet<>();
        LinkedHashSet<String> securities  = new LinkedHashSet<>();
        LinkedHashSet<String> gatekeepers = new LinkedHashSet<>();
        LinkedHashSet<String> entrances   = new LinkedHashSet<>();
        for (var r : rows) {
            inviters.add(r.inviterUsername());
            securities.add(r.securityOfficer());
            gatekeepers.add(r.gatekeeper());
            entrances.add(r.entranceName());
        }

        List<SankeyNode> nodes = new ArrayList<>();
        inviters.forEach(u    -> nodes.add(new SankeyNode("inviter:"    + u, u, "inviter")));
        securities.forEach(u  -> nodes.add(new SankeyNode("security:"   + u, u, "security")));
        gatekeepers.forEach(u -> nodes.add(new SankeyNode("gatekeeper:" + u, u, "gatekeeper")));
        entrances.forEach(e   -> nodes.add(new SankeyNode("entrance:"   + e, e, "entrance")));

        // Aggregate links across all three hops
        Map<String, Integer> linkMap = new LinkedHashMap<>();
        for (var r : rows) {
            String k1 = "inviter:"    + r.inviterUsername()  + "|security:"   + r.securityOfficer();
            String k2 = "security:"   + r.securityOfficer()  + "|gatekeeper:" + r.gatekeeper();
            String k3 = "gatekeeper:" + r.gatekeeper()        + "|entrance:"   + r.entranceName();
            linkMap.merge(k1, r.count(), Integer::sum);
            linkMap.merge(k2, r.count(), Integer::sum);
            linkMap.merge(k3, r.count(), Integer::sum);
        }

        List<SankeyLink> links = new ArrayList<>();
        linkMap.forEach((k, v) -> {
            String[] parts = k.split("\\|", 2);
            links.add(new SankeyLink(parts[0], parts[1], v));
        });

        return new SankeyResponse(nodes, links, refused);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void requireAdmin(String authHeader) {
        String username = requireUsername(authHeader);
        boolean isAdmin = identityService.createGroupQuery()
                .groupMember(username).groupId("webAdmins").count() > 0;
        if (!isAdmin)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins only");
    }

    private String requireUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        try {
            String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)));
            String[] parts = decoded.split(":", 2);
            if (parts.length >= 1 && !parts[0].isBlank()) return parts[0];
        } catch (IllegalArgumentException ignored) {}
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}
