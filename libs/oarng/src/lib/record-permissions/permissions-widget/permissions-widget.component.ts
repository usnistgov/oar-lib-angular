import { Component, OnInit, Input } from '@angular/core';
import { KeyValue } from '@angular/common';
import { UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
// import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';
import { SDSuggestion, SDSIndex, StaffDirectoryService } from '../../staffdir/staffdir.service';
// import { ConfigurationService } from '../../config/config.service';
// import { AuthenticationService } from '../../auth/auth.service';

import { Acls } from '../types/acls.type';
import { PermissionsService } from '../services/permissions.service';
import { elementAt } from 'rxjs';


interface aclsProperties{
  read:boolean;
  write:boolean;
  admin:boolean;
  delete:boolean;
}

interface userPermissions{
  usrID: string
  permissions: aclsProperties
}

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

  // We want to load the initial data via service and provide it to the child components. 
  // Assuming that we have an Acls object I call that property initAcls:
  /**
   * The initial data received from the backend.
   * Remove this if you don't have any initial form data.
   */
  initAcls?: Acls;

  /**
   * The current form data, provided by the child forms.
   * This will be sent to the backend when submitting the form.
   */
  currAcls?: Acls;

  aclsProperties: Array<userPermissions> = []

  @Input() recordID: string = "";
  @Input() recordTYPE: string = "";

  ngOnInit(): void {
    console.log(this.recordID);
    console.log(this.recordTYPE);

    // Fetch initial data from the backend
    this.midas_record_service.fetchAcls(this.recordID, this.recordTYPE).subscribe({
      next: data =>{
        this.initAcls = data;
        this.currAcls = data;

        //============== READ ==============
        data.read.forEach((element:string) => {
          // setup initial permissions
          this.aclsProperties.push({usrID:element, permissions:{read:true, write:false, admin:false, delete:false}})
        });

        //============== WRITE ==============
        data.write.forEach( (element:string) =>{
          const index = this.aclsProperties.findIndex( (id) => id.usrID === element)
          if (index === -1){
            // the permissions for this user have not been set up yet so initialize them
            this.aclsProperties.push({usrID:element, permissions:{read:false, write:true, admin:false, delete:false}})            
          }
          else{
            // setup read permissions for already initialized users
            this.aclsProperties[index].permissions.write=true;
          }
        });

        //============== ADMIN ==============
        data.admin.forEach( (element:string) =>{
          const index = this.aclsProperties.findIndex( (id) => id.usrID === element)
          if (index === -1){
            // the permissions for this user have not been set up yet so initialize them
            this.aclsProperties.push({usrID:element, permissions:{read:false, write:false, admin:true, delete:false}})            
          }
          else{
            // setup read permissions for already initialized users
            this.aclsProperties[index].permissions.admin=true;
          }
        });

        //============== DELTE ==============
        data.delete.forEach( (element:string) =>{
          const index = this.aclsProperties.findIndex( (id) => id.usrID === element)
          if (index === -1){
            // the permissions for this user have not been set up yet so initialize them
            this.aclsProperties.push({usrID:element, permissions:{read:false, write:false, admin:false, delete:true}})
          }
          else{
            // setup read permissions for already initialized users
            this.aclsProperties[index].permissions.delete=true;
          }
        });
        

      },
      error: error => {
        console.log(error.message);
      }

    });

  }

  displaySelectedSDSuggestion(name:SDSuggestion):string{
    var res = name && name.display ? name.display : '';
    return res;

  }

  onSubmit(){}

}
