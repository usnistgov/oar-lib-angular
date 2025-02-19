import { Component, OnInit, Input } from '@angular/core';

import { UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
// import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';
import { SDSuggestion, SDSIndex, StaffDirectoryService } from '../../staffdir/staffdir.service';
// import { ConfigurationService } from '../../config/config.service';
// import { AuthenticationService } from '../../auth/auth.service';

import { Acls } from '../types/acls.type';
import { PermissionsService } from '../services/permissions.service';

@Component({
  selector: 'app-permissions-widget',
  templateUrl: './permissions-widget.component.html',
  styleUrls: ['./permissions-widget.component.css']
})
export class PermissionsWidgetComponent implements OnInit{
  
  constructor(
    private fb: UntypedFormBuilder,
    private midas_record_service: PermissionsService,
    
    // private authService: AuthenticationService
  ){    
    console.log("PermissionsWidgetComponent Constructor");
  }

  personelForm = this.fb.group(
    {
      dmp_contributor:            [''],
      contributors:               [[]],
      nistOrganization:           [],
      organizations:              [[]]
    }
  );

  acls?: Acls;

  @Input() recordID: string = "";
  @Input() recordTYPE: string = "";

  ngOnInit(): void {
    console.log(this.recordID);
    console.log(this.recordTYPE);

    // Fetch initial data from the backend
    this.midas_record_service.fetchMIDASRecord(this.recordID, this.recordTYPE).subscribe({
      next: data =>{
        this.acls = data;

      },
      error: error => {
        console.log(error.message);
      }

  });
    

  }
  /**
   * The initial data received from the backend.
   * Remove this if you don't have any initial form data.
   */
  initialACLS?: Acls;

  displaySelectedSDSuggestion(name:SDSuggestion):string{
    var res = name && name.display ? name.display : '';
    return res;

  }

  onSubmit(){}

}
