/*
 * See 
 * https://github.com/usnistgov/oar-lib-angular/blob/feature/common-config/libs/oarng/src/lib/config/README.md
 * for documentation explaining the role of this file.
 */
import { Configuration } from "../../config/config.model";

export interface EndPointsConfiguration extends Configuration {

  /**
   * PDRDMP is link for the DBIO interface for DMPs on deployment server
   */
  PDRDMP: string;

  /**
   * PDRDMP is link for the DBIO interface for DAPs on deployment server
   */
  PDRDAP: string;

  /**
   * other parameters are allowed (as per the parent interface)
   */
}