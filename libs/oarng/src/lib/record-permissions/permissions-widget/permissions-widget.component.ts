import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule, UntypedFormControl, UntypedFormBuilder, FormControl, DefaultValueAccessor } from '@angular/forms';
import { Observable, switchMap, map, catchError } from 'rxjs';

import { SDSuggestion, SDSIndex, StaffDirectoryService } from '../../staffdir/staffdir.service';
import { Acls } from '../types/acls.type';
import { PermissionsService } from '../services/permissions.service';


interface userPermissions{
  userID: string
  name:string
  read:boolean;
  write:boolean;
  admin:boolean;
  delete:boolean;
}

// Schema for Contributors data table
const CONTRIB_COL_SCHEMA = [

  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
  {
    key: 'name',
    type: 'text',
    label: 'User Name',
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
  styleUrls: ['./permissions-widget.component.scss']
})
export class PermissionsWidgetComponent implements OnInit{
  
  constructor(
    private fb: UntypedFormBuilder,
    private record_permissions_service: PermissionsService,    
    private sdsvc: StaffDirectoryService
  ){
    this.getNistContactsFromAPI();
    
  }

  contrib_dispCols: string[] = CONTRIB_COL_SCHEMA.map((col) => col.key);
  contrib_colSchema: any = CONTRIB_COL_SCHEMA;

  personelForm = this.fb.group(
    {
      dmp_contributor:            new FormControl(''),
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
  currAcls: Acls = {read:[], write:[], admin:[], delete:[]};
  aclsProperties: Array<userPermissions> = []

  crntContribName:string = '';
  //crntContribSurname:string  = '';
  nistUsername:string  = '';
  
  fltr_NIST_Contributor!: Observable<SDSuggestion[]>;

  // =====================
  //  for people service
  // =====================

  minPromptLength = 2;                  // don't do any searching of people service unless we have 2 chars
  // for people search
  sd_index: SDSIndex|null = null;       // the index we will download after the first minPromptLength (2) characters are typed
  suggestions: SDSuggestion[] = []      // the current list of suggested completions matching what has been typed so far.
  presonID: number = 0;
  disableAdd:boolean = true;


  @Input() recordID: string = "";
  @Input() recordTYPE: string = "";

  ngOnInit(): void {

    // Fetch initial data from the backend
    this.record_permissions_service.fetchAcls(this.recordID, this.recordTYPE).subscribe({
      next: data =>{
        this.initAcls = data;
        this.initiateAclsProperties(data);
        this.setUserNames();
        
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
      this.aclsProperties.push({userID:element, name:'', read:true, write:false, admin:false, delete:false});
    });

    //============== WRITE ==============
    data.write.forEach( (element:string) =>{
      const index = this.aclsProperties.findIndex( (id) => id.userID === element);
      if (index === -1){
        // the permissions for this user have not been set up yet so initialize them
        this.aclsProperties.push({userID:element, name:'', read:false, write:true, admin:false, delete:false});
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
        this.aclsProperties.push({userID:element, name:'', read:false, write:false, admin:true, delete:false});
      }
      else{
        // setup read permissions for already initialized users
        this.aclsProperties[index].admin=true;
      }
    });

    // ============== DELTE ==============
    data.delete.forEach( (element:string) =>{
      const index = this.aclsProperties.findIndex( (id) => id.userID === element);
      if (index === -1){
        // the permissions for this user have not been set up yet so initialize them
        this.aclsProperties.push({userID:element, name:'', read:false, write:false, admin:false, delete:true});
      }
      else{
        // setup read permissions for already initialized users
        this.aclsProperties[index].delete=true;
      }
    });
  }

  setUserNames(){
    this.aclsProperties.forEach(
      (person)=>{
        this.sdsvc.getPersonByUserName(person.userID).subscribe(
          {
            next:(usrInfo:any) => {
              if(usrInfo !== null){
                person.name = this.makeFullUserName(usrInfo);
                // Sort by name in ascending order
                this.aclsProperties =this.aclsProperties.slice().sort((a, b) =>  a.name.localeCompare(b.name));
              }
            }
          }
        );
      }
    );
  }

  makeFullUserName(rec:any):string{
    // ==================================================================
    // use below if we want to display alternate first name
    // ==================================================================

    // var usrName:string = '';
    // if (typeof rec['altFirstName'] === 'string' && rec['altFirstName'] !== ''){
    //   usrName = rec['lastName'] + " "+ rec['altFirstName'];
    // }
    // else{
    //   usrName = rec['lastName'] + " "+ rec['firstName'];
    // }
    return rec['lastName'] + ", "+ rec['firstName'];
  }
  

  getNistContactsFromAPI(){
    this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
      switchMap(usrInput => {        
        // clear values until the user has picked a selection. 
        // This forces the form to accept only values that were selected from the dropdown menu
        this.crntContribName = '';
        // this.crntContribSurname = '';

        const val = typeof usrInput === 'string'; //checks the type of input value
        if (!val){ 
          // if value is not string that means the user has picked a selection from dropdown suggestion box
          // so return an empty array to clear the dropdown suggestion box and set form values accordingly

          // returning result made to an async call
          this.presonID = usrInput.id;
          return usrInput.getRecord().pipe(
            map((rec:any) =>{ // typecast return of getRecord as 'any' since we're expecting an object type there
              this.crntContribName = this.makeFullUserName(rec);
                 
              this.nistUsername = rec.nistUsername;

              // clear sarch suggestions since the user has selected an option from drop down menu
              this.sd_index = null;
              this.suggestions = [];
              // enable adding of contact to contributors list
              this.disableAdd=false;
              // retuns an empty array to the next function in the pipe -> in this case a map function
              return this.suggestions;
            }),
            catchError( err => {
              console.log('Failed to pull people record'+err)
              return []
            })
          )
        }

        if (usrInput.trim().length >= this.minPromptLength){
          // this is where initial querying of people service occurs if user has typed more than two characters

          if (! this.sd_index) {
              // if initial query was not performed yet, query people service based on first two letters
              // and return array of suggestions that will be passed to the next function in the pipe

              // returning result from an async call
              return this.sdsvc.getPeopleIndexFor(usrInput).pipe(
                map( idx => {
                  this.sd_index = idx;
                  if (this.sd_index != null) {
                      // pull out the matching suggestions
                      this.suggestions = (this.sd_index as SDSIndex).getSuggestions(usrInput);
                  }
                  return this.suggestions;
                }),
                catchError( err => {
                  console.log('Failed to pull people index for "'+usrInput+'"'+err)
                  return [];
                })
                
              )
          }
          
        }
        // pass user input as a string array to the next function in the pipe -> in this case the map function
        return [usrInput];
      }),     
      map (pipedValue => {
          // Data that comes here is piped in from the previous function in the pipeline in this case switchMap function

          const val = typeof pipedValue === 'string'; //checks the type of value passed down by the switchMap function

          if (!val){ 
            // if value is not string that means that one of two thing have happened:
            // 1) we need to display initial drop down suggestions based on initial people query results
            // 2) the user has selected an option from the drop down menu in which case the suggestions array is empty so we return it
            return this.suggestions;
          }
          else if (typeof pipedValue === 'string' && pipedValue.trim().length >= 2 && this.sd_index){
            // we already have a downloaded index; just pull out the matching suggestions
            // and return the array of suggestions for the dropdown menu 
            this.suggestions = (this.sd_index as SDSIndex).getSuggestions(pipedValue);
            return this.suggestions;
          }
          else if (typeof pipedValue === 'string' && pipedValue.trim().length < 2 && this.sd_index){
            // if the input was cleared, clear out our index and suggestions
            this.sd_index = null;
            this.suggestions = [];
            return this.suggestions;
          }

          // if number of characters entered are less than two return an empty array
          return [];
        }
      )

    );
  }

 

  displaySelectedSDSuggestion(name:SDSuggestion):string{
    var res = name && name.display ? name.display : '';
    return res;

  }

  updateAclsProperties(usr:string, checked:boolean, permission:string){
    var index = this.aclsProperties.findIndex( (id) => id.userID === usr);

    if (index === -1){
      //added new user so initialize new entry and set all permissions to false
      this.aclsProperties.push({userID:usr, name:'', read:false, write:false, admin:false, delete:true})
      
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

  /**
   * Converts acls permissions to the required format
   */
  convertAcls(){
    this.currAcls = {read:[], write:[], admin:[], delete:[]};
    this.aclsProperties.forEach(
      (user)=>{
        if (user.read){
          this.currAcls?.read.push(user.userID);
        }

        if (user.write){
          this.currAcls?.write.push(user.userID);
        }

        if (user.admin){
          this.currAcls?.admin.push(user.userID);
        }

        if (user.delete){
          this.currAcls?.delete.push(user.userID);
        }
      }
    );

  }

  saveAcls(){
    this.convertAcls();
    this.record_permissions_service.updateAcls(this.recordID, this.recordTYPE, this.currAcls).subscribe(
      {
        next: data => {
          //try to reload the page to read the saved dmp from mongodb
          // this.router.navigate(['edit', this.id]);
          alert("Successfuly saved record permissions");
        },
        error: error => {
          console.log(error.message);
        }
        
      }
    );
  }

  removeRow(id:userPermissions) {
    const result = confirm("Are you sure you want to remove all privileges from "+ id.userID + " for this record?");
    if (result) {
      this.aclsProperties = this.aclsProperties.filter(
        (row) => row.userID !== id.userID        
      );
    }
  }

  addUser(){
    // check if user is already in the list
    const index = this.aclsProperties.findIndex( (id) => id.userID === this.nistUsername);
    if (index === -1){
      // the permissions for this user have not been set up yet so initialize them
      // add write priviledge by default
      const newRow = {userID:this.nistUsername, name:this.crntContribName, read:true, write:false, admin:false, delete:false}
      
      // create a new array using an existing array as one part of it 
      // using the spread operator '...'
      this.aclsProperties = [newRow, ...this.aclsProperties];
      // Sort by name in ascending order
      this.aclsProperties =this.aclsProperties.slice().sort((a, b) =>  a.name.localeCompare(b.name));
      this.resetFormFields();
    }
    else{
      // send alert that this user is already in the table
      alert("This has already been assigned privileges for this record. You can change them by clicking on check boxes.")
    }
    

  }

  /**
   * Resets form fields
   */
  private resetFormFields(){
    this.crntContribName = '';
    // this.crntContribSurname = '';
    this.nistUsername = '';
    this.personelForm.controls['dmp_contributor'].setValue("");
    this.disableAdd = true;
  }

  onSubmit(){}

}
