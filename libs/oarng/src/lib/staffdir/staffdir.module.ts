import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigModule } from '../config/config.module';
import { SDSConfiguration, SDSuggestion, SDSIndex, StaffDirectoryService } from './staffdir.service';

/**
 * a module providing the StaffDirectoryService for accessing the oar1 version of the staff directory
 * service, providing information about people and the organizations within the org-chart they belong 
 * to.  
 */
@NgModule({
    imports: [
        ConfigModule
    ],
    declarations: [
    ],
    providers: [
        StaffDirectoryService
    ]
})
export class StaffDirModule { }

export { SDSConfiguration, SDSuggestion, SDSIndex, StaffDirectoryService }
