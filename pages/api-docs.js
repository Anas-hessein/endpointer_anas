import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import swaggerSpec from "../swagger.json";

export default function ApiDocs() {
  return <SwaggerUI spec={swaggerSpec} />;
}
