import { NamedParameters, AnyObj } from "./namedparams";

describe("NamedParameters", function() {
    let data : AnyObj = {
        "links": {
            orgHome: "https://data.nist.gov/",
            rabbitHoles: {
                endless: "/endless",
                deadend: "/endless/deadend"
            }
        }
    };

    it("get()", function() {
        let p: NamedParameters = new NamedParameters(data);
        debugger;
        expect(p.data).toBe(data);
        expect(p.get("links", "unconfigured")).toBe(data["links"]);
        expect(p.get("apis", "unconfigured")).toBe("unconfigured");
        expect(p.get("apis")).toBe(undefined);
        expect(p.get("links.orgHome", "unconfigured")).toBe("https://data.nist.gov/");
        expect(p.get("links.rabbitHoles.deadend", "unconfigured")).toBe("/endless/deadend");
        expect(p.get("links.rabbitHoles.conspiracy", "unconfigured")).toBe("unconfigured");
    });

    it("construction-time defaults", function() {
        let defs = {
            links: {
                orgHome: "https://google.com",
                portalHome: "/sdp",
                rabbitHoles: { }
            },
            apis: false   
        }
        let p: NamedParameters = new NamedParameters(data, defs);
        expect(p.data).toBe(data);
        expect(p.get("links", "unconfigured")).toBe(data["links"]);
        expect(p.get("apis", "unconfigured")).toBe("unconfigured");
        expect(p.get("apis")).toBe(false);
        expect(p.get("links.orgHome", "unconfigured")).toBe("https://data.nist.gov/");
        expect(p.get("links.portalHome")).toBe("/sdp");
        expect(p.get("links.rabbitHoles.deadend", "unconfigured")).toBe("/endless/deadend");
        expect(p.get("links.rabbitHoles.conspiracy", "unconfigured")).toBe("unconfigured");
    });
});
