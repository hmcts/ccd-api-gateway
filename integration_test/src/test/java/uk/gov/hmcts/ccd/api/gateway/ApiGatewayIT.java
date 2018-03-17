package uk.gov.hmcts.ccd.api.gateway;

import com.github.tomakehurst.wiremock.common.Slf4jNotifier;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.junit.WireMockClassRule;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.*;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static io.restassured.RestAssured.given;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ApiGatewayIT {

    private static final String USER_TOKEN_BEARER = "Bearer azerty";
    private static final String S2S_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDY1OTczOTksImV4cCI6MTUzODEzMzM5OSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.SrjiYVYP9nzgRv0gt_-bgqGQyqcQJ5SlALlYYarAfmk";
    private static final String ADDRESS_LOOKUP_TOKEN = "xyz";
    private static final Slf4jNotifier slf4jNotifier = new Slf4jNotifier(true);

    @ClassRule
    public static WireMockClassRule CORE_CASE_DATA_API_RULE = new WireMockClassRule(new WireMockConfiguration().port(4452).notifier(slf4jNotifier));
    @ClassRule
    public static WireMockClassRule DEFINITION_API_RULE = new WireMockClassRule(new WireMockConfiguration().port(4451).notifier(slf4jNotifier));
    @ClassRule
    public static WireMockClassRule IDAM_USER_AUTH_RULE = new WireMockClassRule(new WireMockConfiguration().port(4501).notifier(slf4jNotifier));
    @ClassRule
    public static WireMockClassRule IDAM_S2S_AUTH_RULE = new WireMockClassRule(new WireMockConfiguration().port(4502).notifier(slf4jNotifier));
    @ClassRule
    public static WireMockClassRule POSTCODE_COMPONENT_RULE = new WireMockClassRule(new WireMockConfiguration().httpsPort(4443).notifier(slf4jNotifier));

    private static Process nodeJsAppProcess;
    private static ProcessBuilder pb = new ProcessBuilder("node", "bin/www");

    @BeforeClass
    public static void setupBeforeClass() throws Exception {
        RestAssured.baseURI = "http://localhost/";
        RestAssured.port = 3453;

        pb.environment().put("IDAM_SERVICE_KEY", "serviceSecret");
        pb.environment().put("ADDRESS_LOOKUP_URL", "https://127.0.0.1:4443/addresses?postcode=${postcode}");
        pb.environment().put("ADDRESS_LOOKUP_TOKEN", ADDRESS_LOOKUP_TOKEN);
        pb.environment().put("NODE_TLS_REJECT_UNAUTHORIZED", "0");
        pb.directory(new File("../"));
        pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);
        pb.redirectError(ProcessBuilder.Redirect.INHERIT);
    }

    @Before
    public void setUp() throws Exception {
        CORE_CASE_DATA_API_RULE.resetAll();
        DEFINITION_API_RULE.resetAll();
        IDAM_USER_AUTH_RULE.resetAll();
        IDAM_S2S_AUTH_RULE.resetAll();
        POSTCODE_COMPONENT_RULE.resetAll();

        nodeJsAppProcess = pb.start();
        Thread.sleep(900L);
    }

    @After
    public void tearDown() {
        nodeJsAppProcess.destroyForcibly();
    }

    @Test
    public void shouldProxyToDataIfUserAndS2SAuthenticated() {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
                .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));
        CORE_CASE_DATA_API_RULE.stubFor(get(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .withHeader("ServiceAuthorization", equalTo(S2S_TOKEN))
                .willReturn(aResponse().withStatus(200)));

        given().header("Authorization", USER_TOKEN_BEARER)
                .contentType("application/json")
                .expect()
                .statusCode(200)
                .when()
                .get("/data/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases");

        CORE_CASE_DATA_API_RULE.verify(getRequestedFor(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .withHeader("ServiceAuthorization", equalTo(S2S_TOKEN)));
    }

    @Test
    public void shouldProxyToAggregatedIfUserAndS2SAuthenticated() {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
                .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));
        CORE_CASE_DATA_API_RULE.stubFor(get(urlEqualTo("/aggregated/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/inputs"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .withHeader("ServiceAuthorization", equalTo(S2S_TOKEN))
                .willReturn(aResponse().withStatus(200)));

        given().header("Authorization", USER_TOKEN_BEARER)
                .contentType("application/json")
                .expect()
                .statusCode(200)
                .when()
                .get("/aggregated/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/inputs");

        CORE_CASE_DATA_API_RULE.verify(getRequestedFor(urlEqualTo("/aggregated/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/inputs"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .withHeader("ServiceAuthorization", equalTo(S2S_TOKEN)));
    }

    @Test
    public void shouldProxyToDefinitionImportIfUserAndS2SAuthenticated() {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
                .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));
        DEFINITION_API_RULE.stubFor(get(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .withHeader("ServiceAuthorization", equalTo(S2S_TOKEN))
                .willReturn(aResponse().withStatus(200)));

        given().header("Authorization", USER_TOKEN_BEARER)
                .contentType("application/json")
                .expect()
                .statusCode(200)
                .when()
                .get("/definition_import/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases");

        DEFINITION_API_RULE.verify(getRequestedFor(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases")).
                withHeader("Authorization", equalTo(USER_TOKEN_BEARER)).
                withHeader("ServiceAuthorization", equalTo(S2S_TOKEN)));
    }

    @Test
    public void shouldProxyPostcodeServiceWithTokenIfUserAndS2SAuthenticated() throws Exception {

        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
                .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));

        POSTCODE_COMPONENT_RULE.stubFor(get(urlEqualTo("/addresses?postcode=NE404UX"))
                .withHeader("Authorization", equalTo("Token " + ADDRESS_LOOKUP_TOKEN))
                .willReturn(okJson(postcodeServiceResponse()).withStatus(200)));

        Response response = given().header("Authorization", USER_TOKEN_BEARER)
                .contentType("application/json")
                .get("/addresses?postcode=NE404UX");

        assertEquals(String.format("Expected 200 but was %s with body %s", response.getStatusCode(), response.getBody().print()),
                        200,
                        response.getStatusCode());

        List<Map> body = response.as(List.class);
        assertEquals(4, body.size());
        Map firstEntry = body.get(0);
        assertEquals("1 Lambton Close", firstEntry.get("AddressLine1"));

    }

    @Test
    public void shouldReturnAppropriateErrorWhenPostcodeServiceErrors() throws Exception {

        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
                .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
                .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
                .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));

        POSTCODE_COMPONENT_RULE.stubFor(get(urlEqualTo("/addresses?postcode=NE404UX"))
                .withHeader("Authorization", equalTo("Token " + ADDRESS_LOOKUP_TOKEN))
                .willReturn(status(500)));

        Response response = given().header("Authorization", USER_TOKEN_BEARER)
                .contentType("application/json")
                .get("/addresses?postcode=NE404UX");

        assertEquals(String.format("Expected 500 but was %s with body %s", response.getStatusCode(), response.getBody().print()),
                500,
                response.getStatusCode());

        Map body = response.as(Map.class);
        assertTrue("Should have a unique id in error field",
                Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
                    .matcher((String)body.get("error")).matches());
        assertEquals(500, body.get("status"));
        assertEquals("An error occurred calling the Postcode service.", body.get("message"));

    }

    @Test
    public void shouldFailToProxyIfUserAuthFails() throws Exception {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
            .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
            .willReturn(unauthorized()));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
            .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));

        given().header("Authorization", USER_TOKEN_BEARER)
            .contentType("application/json")
            .expect()
            .statusCode(401)
            .when()
            .get("/data/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases");

        CORE_CASE_DATA_API_RULE.verify(0 , getRequestedFor(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases")));

    }


    @Test
    public void shouldFailToProxyIfUserAuthCallFails() throws Exception {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
            .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
            .willReturn(serviceUnavailable()));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
            .willReturn(aResponse().withBody(S2S_TOKEN).withStatus(200)));

        given().header("Authorization", USER_TOKEN_BEARER)
            .contentType("application/json")
            .expect()
            .statusCode(503)
            .when()
            .get("/data/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases");

        CORE_CASE_DATA_API_RULE.verify(0, getRequestedFor(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases")));
    }

    @Test
    public void shouldFailToProxyIfS2SAuthFails() throws Exception {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
            .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
            .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
            .willReturn(unauthorized()));

        given().header("Authorization", USER_TOKEN_BEARER)
            .contentType("application/json")
            .expect()
            .statusCode(401)
            .when()
            .get("/data/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases");

        CORE_CASE_DATA_API_RULE.verify(0 , getRequestedFor(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases")));
    }

    @Test
    public void shouldFailToProxyIfS2SCallFails() throws Exception {
        IDAM_USER_AUTH_RULE.stubFor(get(urlEqualTo("/details"))
            .withHeader("Authorization", equalTo(USER_TOKEN_BEARER))
            .willReturn(okJson("{\"id\":\"0\",\"roles\": [\"caseworker-test\"]}").withStatus(200)));
        IDAM_S2S_AUTH_RULE.stubFor(post(urlEqualTo("/lease"))
            .willReturn(serviceUnavailable()));

        given().header("Authorization", USER_TOKEN_BEARER)
            .contentType("application/json")
            .expect()
            .statusCode(503)
            .when()
            .get("/data/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases");

        CORE_CASE_DATA_API_RULE.verify(0, getRequestedFor(urlEqualTo("/caseworkers/0/jurisdictions/TEST/case-types/TEST-CASE-TYPE/cases")));
    }

    private String postcodeServiceResponse() {
       return "[  \n" +
                "   {  \n" +
                "      \"uprn\":\"100000083718\",\n" +
                "      \"organisation_name\":\"\",\n" +
                "      \"department_name\":\"\",\n" +
                "      \"po_box_number\":\"\",\n" +
                "      \"building_name\":\"\",\n" +
                "      \"sub_building_name\":\"\",\n" +
                "      \"building_number\":1,\n" +
                "      \"thoroughfare_name\":\"LAMBTON CLOSE\",\n" +
                "      \"dependent_thoroughfare_name\":\"\",\n" +
                "      \"dependent_locality\":\"\",\n" +
                "      \"double_dependent_locality\":\"\",\n" +
                "      \"post_town\":\"RYTON\",\n" +
                "      \"postcode\":\"NE40 4UX\",\n" +
                "      \"postcode_type\":\"S\",\n" +
                "      \"formatted_address\":\"1 Lambton Close\\nRyton\\nNE40 4UX\",\n" +
                "      \"point\":{  \n" +
                "         \"type\":\"Point\",\n" +
                "         \"coordinates\":[  \n" +
                "            -1.7834685,\n" +
                "            54.9664532\n" +
                "         ]\n" +
                "      }\n" +
                "   },\n" +
                "   {  \n" +
                "      \"uprn\":\"100000083719\",\n" +
                "      \"organisation_name\":\"\",\n" +
                "      \"department_name\":\"\",\n" +
                "      \"po_box_number\":\"\",\n" +
                "      \"building_name\":\"\",\n" +
                "      \"sub_building_name\":\"\",\n" +
                "      \"building_number\":2,\n" +
                "      \"thoroughfare_name\":\"LAMBTON CLOSE\",\n" +
                "      \"dependent_thoroughfare_name\":\"\",\n" +
                "      \"dependent_locality\":\"\",\n" +
                "      \"double_dependent_locality\":\"\",\n" +
                "      \"post_town\":\"RYTON\",\n" +
                "      \"postcode\":\"NE40 4UX\",\n" +
                "      \"postcode_type\":\"S\",\n" +
                "      \"formatted_address\":\"2 Lambton Close\\nRyton\\nNE40 4UX\",\n" +
                "      \"point\":{  \n" +
                "         \"type\":\"Point\",\n" +
                "         \"coordinates\":[  \n" +
                "            -1.7836567,\n" +
                "            54.9663007\n" +
                "         ]\n" +
                "      }\n" +
                "   },\n" +
                "   {  \n" +
                "      \"uprn\":\"100000083720\",\n" +
                "      \"organisation_name\":\"\",\n" +
                "      \"department_name\":\"\",\n" +
                "      \"po_box_number\":\"\",\n" +
                "      \"building_name\":\"\",\n" +
                "      \"sub_building_name\":\"\",\n" +
                "      \"building_number\":3,\n" +
                "      \"thoroughfare_name\":\"LAMBTON CLOSE\",\n" +
                "      \"dependent_thoroughfare_name\":\"\",\n" +
                "      \"dependent_locality\":\"\",\n" +
                "      \"double_dependent_locality\":\"\",\n" +
                "      \"post_town\":\"RYTON\",\n" +
                "      \"postcode\":\"NE40 4UX\",\n" +
                "      \"postcode_type\":\"S\",\n" +
                "      \"formatted_address\":\"3 Lambton Close\\nRyton\\nNE40 4UX\",\n" +
                "      \"point\":{  \n" +
                "         \"type\":\"Point\",\n" +
                "         \"coordinates\":[  \n" +
                "            -1.7837193,\n" +
                "            54.9662829\n" +
                "         ]\n" +
                "      }\n" +
                "   },\n" +
                "   {  \n" +
                "      \"uprn\":\"100000083721\",\n" +
                "      \"organisation_name\":\"\",\n" +
                "      \"department_name\":\"\",\n" +
                "      \"po_box_number\":\"\",\n" +
                "      \"building_name\":\"\",\n" +
                "      \"sub_building_name\":\"\",\n" +
                "      \"building_number\":4,\n" +
                "      \"thoroughfare_name\":\"LAMBTON CLOSE\",\n" +
                "      \"dependent_thoroughfare_name\":\"\",\n" +
                "      \"dependent_locality\":\"\",\n" +
                "      \"double_dependent_locality\":\"\",\n" +
                "      \"post_town\":\"RYTON\",\n" +
                "      \"postcode\":\"NE40 4UX\",\n" +
                "      \"postcode_type\":\"S\",\n" +
                "      \"formatted_address\":\"4 Lambton Close\\nRyton\\nNE40 4UX\",\n" +
                "      \"point\":{  \n" +
                "         \"type\":\"Point\",\n" +
                "         \"coordinates\":[  \n" +
                "            -1.7838602,\n" +
                "            54.9662202\n" +
                "         ]\n" +
                "      }\n" +
                "   }\n" +
                "]";
    }

}
