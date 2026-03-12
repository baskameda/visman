package eu.poc.claude.location;

public class Location {

    private Long   id;
    private String name;
    private String description;
    private Double latitude;
    private Double longitude;
    private int    entranceCount; // populated in list queries only

    public Long   getId()                    { return id; }
    public void   setId(Long v)              { this.id = v; }

    public String getName()                  { return name; }
    public void   setName(String v)          { this.name = v; }

    public String getDescription()           { return description; }
    public void   setDescription(String v)   { this.description = v; }

    public Double getLatitude()              { return latitude; }
    public void   setLatitude(Double v)      { this.latitude = v; }

    public Double getLongitude()             { return longitude; }
    public void   setLongitude(Double v)     { this.longitude = v; }

    public int    getEntranceCount()         { return entranceCount; }
    public void   setEntranceCount(int v)    { this.entranceCount = v; }
}
