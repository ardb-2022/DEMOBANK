import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';

interface Transaction {
  brn_cd: string;
  agent_cd: string;
  trans_dt: string;
  trans_amt: number;
  trans_type: string;
  agent_name?: string;
}
interface Agent {
  brn_cd: string;
  agent_cd: string;
  agent_name: string;
}
@Component({
  selector: 'app-agent-deposit-details-sum',
  templateUrl: './agent-deposit-details-sum.component.html',
  styleUrls: ['./agent-deposit-details-sum.component.css'],
  providers:[ExportAsService]
})
export class AgentDepositDetailsSumComponent {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource()
  displayedColumns: string[] = ['agent_cd','agent_name', 'deposit_amt', 'commission', 'interest', 'withdrawal', 'deduction'];
  notvalidate:boolean=false;
  date_msg:any;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  trailbalance: tt_trial_balance[] = [];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  showAlert2 = false;
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  counter=0
  afterPost:boolean=false;
  suggestedCustomer: mm_customer[];
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  groupedArray:any=[]
  grandTotal:any=0;
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  response:any;
  pageChange: any;
  total_comm=0;
  total_dep=0;
  apiurl:any;
  lastAccCD:any;
  today:any
  allAgent:Agent[]=[];
  filteredData:any=[];
  selectedAgent: string = 'ALL';
  showHideAgent:boolean=false;
  totals: any = {};
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer:CommonServiceService) { }
  ngOnInit(): void {
    this.getAgentList();
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required]
    });
    this.filteredData = this.groupedArray;
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
       this.onLoadScreen(this.content);
  }
  //  get filteredData() {
  //   if (this.selectedAgent === 'ALL') {
  //     return this.groupedArray;
  //   }
  //   return this.groupedArray.filter(g => g.agent_cd === this.selectedAgent);
  // }
   onAgentChange(agentCd: string) {
    if (agentCd === 'ALL') {
      this.filteredData = this.groupedArray;
      this.calculateGrandTotal();
    } else {
      this.filteredData = this.groupedArray.filter(g => g.agent_cd === agentCd);
      this.grandTotal = this.filteredData.reduce((sum, g) => sum + g.total, 0);
    }
  }
  onLoadScreen(content) {
    this.notvalidate=false
    this.modalRef = this.modalService.show(content, this.config);
  }
  isRetrieve(){
    this.onLoadScreen(this.content);
  }
  
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  getAgentList() {
    var dt = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": "%"
    }
    this.svc.addUpdDel<any>('Deposit/GetAgentData', dt).subscribe(res => {
      this.allAgent=res;
    })
  }
  selectAgent(agent:any){
    this.reportcriteria.controls.agent_cd.setValue(agent.agent_cd);
    this.selectedAgent=agent.agent_name;
    this.showHideAgent=false
    debugger;
    // this.retrieveData();
  }
  onshow(i:any)
  {
    if(i.target.value==''){
      this.showHideAgent=false
    }
    else{
      this.allAgent=this.allAgent.filter(e=>e.agent_name.toLowerCase().includes(i.target.value.toLowerCase()) || e.agent_cd.includes(i.target.value.toLowerCase()) ==true)
      this.showHideAgent=true
    }
    debugger
  }
  public SubmitReport() {
    this.comSer.getDay(this.reportcriteria.controls.fromDate.value,this.reportcriteria.controls.toDate.value)
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else if(this.comSer.diff<0){
      this.date_msg= this.comSer.date_msg
      this.notvalidate=true
    }
    else {
      this.total_dep=0;
      this.total_comm=0;
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.modalRef.hide();
      this.isLoading=true;
      var dt={
      "brn_cd": this.sys.BranchCode=='100'?'%':this.sys.BranchCode,
       "from_dt" : this.fromdate.toISOString(),
       "to_dt" : this.toDate.toISOString()
      }
      
      this.svc.addUpdDel('Deposit/GetAgentTransactions',dt).subscribe(data=>{console.log(data)
        this.reportData=data;
        if(!this.reportData){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } 
        else{
          this.createGroup();
        }
       
        this.isLoading=false
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        // this.pageChange=document.getElementById('chngPage');
        // // this.pageChange.click()
        // this.setPage(2);
        // this.setPage(1);
        this.modalRef.hide();
        // this.reportData.forEach(e=>{
        //   this.total_dep+=e.deposited_amt;
        //   this.total_comm+=e.commission;
          
        // })
        },
        err => {
           this.isLoading = false;
           this.comSer.SnackBar_Error(); 
          })
        this.showAlert = false;
    }
  }
  createGroup(){
     // join with agent names
    const enriched = this.reportData.map(t => {
      const agent = this.allAgent.find(a => a.agent_cd === t.agent_cd);
      return { ...t, agent_name: agent ? agent.agent_name : "Unknown" };
    });

    // group by agent_cd
    const grouped: any = {};
    enriched.forEach(t => {
      if (!grouped[t.agent_cd]) {
        grouped[t.agent_cd] = { agent_name: t.agent_name, transactions: [], total: 0 };
      }
      grouped[t.agent_cd].transactions.push(t);
      grouped[t.agent_cd].total += t.trans_amt;
    });

    this.groupedArray = Object.keys(grouped).map(key => ({
      agent_cd: key,
      agent_name: grouped[key].agent_name,
      transactions: grouped[key].transactions,
      total: grouped[key].total
    }));

    this.calculateGrandTotal();
    this.filteredData = this.groupedArray;
  }

  calculateGrandTotal() {
    this.grandTotal = this.groupedArray.reduce((sum, g) => sum + g.total, 0);
  }

   calculateTotals() {
    this.totals = {
      open_bal: 0,
      coll_bal: 0,
      close_bal: 0,
      withdrawl_bal: 0,
      loan_collection: 0
    };

      this.reportData.forEach(row => {
      this.totals.open_bal += row.open_bal;
      this.totals.coll_bal += row.coll_bal;
      this.totals.close_bal += row.close_bal;
      this.totals.withdrawl_bal += row.withdrawl_bal;
      this.totals.loan_collection += row.loan_collection;
    });
  }

  public oniframeLoad(): void {
    this.counter++
    if(this.counter==2){
      this.isLoading=false;
      this.counter=0
    }
    else{
      this.isLoading = true;
  
    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
    this.showAlert2 = false;
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    console.log(this.pagedItems)
  
    this.cd.detectChanges();
  }
  downloadexcel(){
    this.exportAsConfig = {
      type: 'csv',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'hiddenTab'
    }
    this.exportAsService.save(this.exportAsConfig, 'cashcumtrial').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    // this.getTotal()
  }
 
  Delete(){

  }
  PostIntt(){
    this.isLoading=true;
    var dt={
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode,
      "adt_trans_dt":this.sys.CurrentDate.toISOString(),
      "gs_user_id": this.sys.UserId
     }
     debugger
     this.svc.addUpdDel('Deposit/PostAgentCommission',dt).subscribe(res=>{console.log(res)
      this.response=res
       if(this.response==0){
        debugger
        this.isLoading=false
        this.showAlert2 = true
        this.afterPost=true;
        this.alertMsg = 'Commission Posting in Agent Account Successfully';
      }
      else{
        this.afterPost=false;
        this.showAlert = true
        this.alertMsg = 'Occurred in Commission Posting';
      }
       
       },
       err => {
          this.afterPost=false;
          this.isLoading = false;
          this.comSer.SnackBar_Error(); 
         })
       
  }


}
