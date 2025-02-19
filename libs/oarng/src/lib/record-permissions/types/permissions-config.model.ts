/*
 * See 
 * https://github.com/usnistgov/oar-lib-angular/blob/feature/common-config/libs/oarng/src/lib/config/README.md
 * for documentation explaining the role of this file.
 */

import { Configuration } from "../../config/config.model";
export interface PermissionsConfig extends Configuration{
  /**
   * PDRMIDAS is link for the DBIO interface on deployment server
   */
  PDRMIDAS: string;

  /**
   * other parameters are allowed (as per the parent interface)
   */
}
