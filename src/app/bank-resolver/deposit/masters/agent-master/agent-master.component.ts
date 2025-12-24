import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { RestService } from 'src/app/_service';
import { LOGIN_MASTER, MessageType, ShowMessage, SystemValues, mm_dist } from '../../../Models';
import { m_branch } from '../../../Models/m_branch';

@Component({
  selector: 'app-agent-master',
  templateUrl: './agent-master.component.html',
  styleUrls: ['./agent-master.component.css']
})
export class AgentMasterComponent implements OnInit {
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  districts: mm_dist[] = [];

  brnDtls: m_branch[]=[];
  sys = new SystemValues()
  isLoading=false;
  agentForm: FormGroup;
  showMsg: ShowMessage;
  isDel = false;
  isRetrieve = false;
  isNew = false;
  isModify = false;
  isSave = false;
  isClear = false;
  blocks:any=[];
  blocks1:any=[];
  disableCode=true;
  b_name:any;
  hiddenOnNull=true;
  agentCode='';
  accountTypeList:any[]=[];
  constructor(private router: Router,private formBuilder: FormBuilder,private svc: RestService,private modalService: BsModalService,) { }
  @ViewChild('contentbatch', { static: true }) contentbatch: TemplateRef<any>;
  modalRef: BsModalRef;
  ngOnInit(): void {
    // this.GetBranchMaster();
  this.getAccountTypeList()
   this.blocks=null;
   this.blocks1=null;
   this.agentCode='';
   
   this.agentForm = this.formBuilder.group({
    ARDB_CD: ['', Validators.required],
    BRN_CD: ['', Validators.required],
    AGENT_CD: ['', Validators.required],
    AGENT_NAME: ['', Validators.required],
    ADDRESS: ['', Validators.required],
    SEX: ['', Validators.required],
    PHONE: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    SECURITY_ACC: ['', Validators.required],
    SECURITY_ACC_TYPE: [0, Validators.required],
    CREATED_BY: ['', Validators.required],
    CUST_CD: [0, Validators.required],
    SB_ACC_NO: [0, Validators.required]
  });
    // this.agentForm.controls.code.disable()
    this.isDel = false;
    this.isRetrieve = true;
    this.isNew = true;
    this.isModify = false;
    this.isSave = true;
    this.isClear = true;
    this.newCall()
  }
  get f() { return this.agentForm.controls; }
  closeScreen()
  {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }
  getAgentID(){
    this.isLoading=true;
    const dt={
      "brn_cd": this.sys.BranchCode
    }     
    this.svc.addUpdDel<any>('Deposit/PopulateAgentCD', dt).subscribe(
      res => {
        if(res?.status=='success'){
          this.agentCode=res.agent_cd;
            this.isLoading=false;
            this.agentForm.patchValue({
              AGENT_CD:this.agentCode,
              ARDB_CD:this.sys.ardbCD,
              BRN_CD:this.sys.BranchCode,
              CREATED_BY:this.sys.UserId
            })
        }else{
           this.isLoading=false;
           this.agentCode='0';
        }
       
      },
      err => {
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Error,'Agent code getting error ' 

    )}
    );
  }
  newCall()
  {
    this.getAgentID();
    this.isDel = false;
    this.isRetrieve = false;
    this.isNew = false;
    this.isModify = false;
    this.isSave = false;
    this.isClear = false;
    // this.GetBranchMaster();
  }
  getAccountTypeList() {

    if (this.accountTypeList.length > 0) {
      return;
    }
    this.accountTypeList = [];
    var dt={
      "ardb_cd":this.sys.ardbCD
    }
    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', dt).subscribe(
      res => {
      
        this.accountTypeList = res;
        this.accountTypeList = this.accountTypeList.filter(c => c.dep_loan_flag === 'D');
        this.accountTypeList = this.accountTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {

      }
    );
  }
  submitAgentData(){
    if(this.agentCode){
      
      if (this.agentForm.valid) {
        const formData = this.agentForm.value;
        console.log(this.agentForm.value);
        
        this.svc.addUpdDel<any>('Deposit/InsertAgentMaster', formData).subscribe(
          res => {
            console.log('Form submitted successfully:', res);
            this.HandleMessage(true, MessageType.Sucess,'Agent saved successfully' );
          // this.initialize();
            // this.agentForm.controls.code.setValue(res)
            this.isDel = false;
            this.isRetrieve = true;
            this.isNew = true;
            this.isModify = false;
            this.isSave = true;
            this.isClear = false;
            this.disableCode=true
          },
          error => {
            this.HandleMessage(true, MessageType.Error,'Agent save Error' );
            console.error('Error submitting form:', error);
          }
        );
      } else {
        this.HandleMessage(true, MessageType.Error,'Form is invalid' );
        console.log('Form is invalid');
      }
    }
    
  
  }
  GetBranchMaster()
  {
    this.isLoading=true;
    ;
    this.svc.addUpdDel('Mst/GetBranchMaster', null).subscribe(
      res => {
        ;
        this.brnDtls=res;
        this.isLoading=false;

      },
      err => {this.isLoading=false; ;}
    )
  }
  OpenBlock(block:any){
    console.log(block)
    this.agentForm.patchValue({
      code:block.block_cd,
      bname:block.block_name
    })
    this.modalRef.hide();
    this.isModify=true
    this.showMsg=null
  }
  
  retrieve ()
  {
    this.hiddenOnNull=false
    this.disableCode=false;
    
    this.agentForm.controls.code.enable()
    this.isModify=true
    // this.getAllBlocks()
  }
  saveuser()
  {
    this.isLoading=true;
    this.showMsg =null;
    var dt={
      "block_name":this.agentForm.controls.bname.value,
      "ardb_cd":this.sys.ardbCD,
      "dist_cd":this.agentForm.controls.district.value,
      "state_cd":this.agentForm.controls.state.value,
    }
    console.log(this.agentForm.controls)
    this.svc.addUpdDel('Mst/InsertBlockMaster', dt).subscribe(
      res => {
        console.log(res)
        ;
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Sucess,'Block saved successfully!' );
        // this.initialize();
        this.agentForm.controls.code.setValue(res)
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
        this.disableCode=true
      this.agentForm.controls.code.disable()

      },
      err => {this.isLoading=false; ; this.HandleMessage(true, MessageType.Error,'Insertion failed!!' );
              this.isDel = false;
              this.isRetrieve = false;
              this.isNew = false;
              this.isModify = false;
              this.isSave = true;
              this.isClear = true;
    }
    )
  }
  updateuser()
  {
    this.isLoading=true;
    this.showMsg =null;
    let login = new LOGIN_MASTER();
    var dt={
      "block_name":this.agentForm.controls.bname.value,
      "ardb_cd":this.sys.ardbCD,
      "block_cd":this.agentForm.controls.code.value
    }
    //login.login_status='N';
    ;
    this.svc.addUpdDel('Mst/UpdateBlock',dt).subscribe(
      res => {
        ;
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Sucess,'Block updated successfully!' );
        // this.initialize();
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
        this.disableCode=true
        this.agentForm.controls.code.disable()

      },
      err => {this.isLoading=false; ; this.HandleMessage(true, MessageType.Error,'Updation failed!!' );
      this.isDel = false;
      this.isRetrieve = true;
      this.isNew = true;
      this.isModify = true;
      this.isSave = false;
      this.isClear = true;
    }
    )
  }
  deleteuser()
  {
    this.isLoading=true;
    this.showMsg =null;
    let login = new LOGIN_MASTER();
    login.user_id = this.f.userid.value;
    login.brn_cd = this.f.branch.value;
    ;
    this.svc.addUpdDel('Sys/DeleteUserMaster', login).subscribe(
      res => {
        ;
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Sucess,'Block deleted successfully!' );
        this.initialize();
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
      },
      err => {this.isLoading=false; ; this.HandleMessage(true, MessageType.Error,'Deletion failed!!' );
      this.initialize();
      this.isDel = false;
      this.isRetrieve = true;
      this.isNew = true;
      this.isModify = false;
      this.isSave = false;
      this.isClear = true;
    }
    )
 }
  clearuser()
  {
    this.initialize();
    this.isDel = false;
    this.isRetrieve = true;
    this.isNew = true;
    this.isModify = false;
    this.isSave = false;
    this.isClear = true;
  }
  initialize()
  {
   this.agentForm.reset()
   this.agentForm.controls.state.setValue(10)
   this.agentForm.controls.district.setValue(131)
   this.disableCode=true;
   this.hiddenOnNull=true
   this.blocks=null
   this.blocks1=null
   this.agentForm.controls.code.disable()

  }
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }


}
