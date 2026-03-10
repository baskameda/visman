package eu.poc.claude.entrance;

public class Entrance {

    private Long   id;
    private String name;
    private String description;
    private Long   locationId;

    public Entrance() {}

    public Long   getId()                  { return id; }
    public void   setId(Long id)           { this.id = id; }

    public String getName()                { return name; }
    public void   setName(String v)        { this.name = v; }

    public String getDescription()         { return description; }
    public void   setDescription(String v) { this.description = v; }

    public Long   getLocationId()          { return locationId; }
    public void   setLocationId(Long v)    { this.locationId = v; }
}
