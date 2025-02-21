import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
// import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';
import { SDSuggestion, SDSIndex, StaffDirectoryService } from '../../staffdir/staffdir.service';
// import { ConfigurationService } from '../../config/config.service';
// import { AuthenticationService } from '../../auth/auth.service';

import { Acls } from '../types/acls.type';
import { PermissionsService } from '../services/permissions.service';


interface userPermissions{
  userID: string
  read:boolean;
  write:boolean;
  admin:boolean;
  delete:boolean;
}

// Schema for Contributors data table
const CONTRIB_COL_SCHEMA = [

  // {
  //   key: 'firstName',
  //   type: 'text',
  //   label: 'Name',
  // },
  // {
  //   key: 'lastName',
  //   type: 'text',
  //   label: 'Surname',
  // },
  {
    key: 'userID',
    type: 'text',
    label: 'User ID',
  },
  {
    key: 'read',
    type: 'isSelected',
    label: 'Read',
    checked: false
  },
  {
    key: 'write',
    type: 'isSelected',
    label: 'Write',
    checked: false
  },
  {
    key: 'admin',
    type: 'isSelected',
    label: 'Admin',
    checked: false
  },
  {
    key: 'delete',
    type: 'isSelected',
    label: 'Delete',
    checked: false
  },
  
]

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

  contrib_dispCols: string[] = CONTRIB_COL_SCHEMA.map((col) => col.key);
  contrib_colSchema: any = CONTRIB_COL_SCHEMA;

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
        this.initiateAclsProperties(data);

      },
      error: error => {
        console.log(error.message);
      }

    });

  }

  initiateAclsProperties(data:Acls){
    //============== READ ==============
    data.read.forEach((element:string) => {
      // setup initial permissions
      this.aclsProperties.push({userID:element, read:true, write:false, admin:false, delete:false});
    });

    //============== WRITE ==============
    data.write.forEach( (element:string) =>{
      const index = this.aclsProperties.findIndex( (id) => id.userID === element);
      if (index === -1){
        // the permissions for this user have not been set up yet so initialize them
        this.aclsProperties.push({userID:element, read:false, write:true, admin:false, delete:false});
      }
      else{
        // setup read permissions for already initialized users
        this.aclsProperties[index].write=true;
      }
    });

    //============== ADMIN ==============
    data.admin.forEach( (element:string) =>{
      const index = this.aclsProperties.findIndex( (id) => id.userID === element);
      if (index === -1){
        // the permissions for this user have not been set up yet so initialize them
        this.aclsProperties.push({userID:element, read:false, write:false, admin:true, delete:false});      
      }
      else{
        // setup read permissions for already initialized users
        this.aclsProperties[index].admin=true;
      }
    });

    //============== DELTE ==============
    data.delete.forEach( (element:string) =>{
      const index = this.aclsProperties.findIndex( (id) => id.userID === element);
      if (index === -1){
        // the permissions for this user have not been set up yet so initialize them
        this.aclsProperties.push({userID:element, read:false, write:false, admin:false, delete:true})
      }
      else{
        // setup read permissions for already initialized users
        this.aclsProperties[index].delete=true;
      }
    });

  }

  displaySelectedSDSuggestion(name:SDSuggestion):string{
    var res = name && name.display ? name.display : '';
    return res;

  }

  updateAclsProperties(usr:string, checked:boolean, permission:string){
    var index = this.aclsProperties.findIndex( (id) => id.userID === usr);
    console.log(usr);
    console.log(permission);
    console.log(checked);
    if (index === -1){
      //added new user so initialize new entry and set all permissions to false
      this.aclsProperties.push({userID:usr, read:false, write:false, admin:false, delete:true})
      
      //get index of newly inserted user
      index = this.aclsProperties.findIndex( (id) => id.userID === usr);      
    }    
    
    if (permission === "read"){
      this.aclsProperties[index].read=checked;
    }
    else if(permission === "write"){
      this.aclsProperties[index].write=checked;
    }
    else if(permission === "admin"){
      this.aclsProperties[index].admin=checked;
    }
    else if(permission === "delete"){
      this.aclsProperties[index].delete=checked;
    }

  }

  onSubmit(){}

}
