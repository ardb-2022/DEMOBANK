import { InAppMessageService } from './../../_service/in-app-message.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { mm_dashboard } from '../Models/mm_dashboard';
import { p_gen_param } from '../Models/p_gen_param';
import { LOGIN_MASTER, mm_customer, SystemValues } from '../Models';
import { RestService } from 'src/app/_service';
import {trigger, style, animate, transition} from '@angular/animations';
import { CommonServiceService } from '../common-service.service';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';


interface User {
  ardb_cd: string | null;
  brn_cd: string | null;
  user_id: string;
  password: string | null;
  login_status: string;
  user_type: string;
  user_first_name: string;
  user_middle_name: string | null;
  user_last_name: string;
  ip: string | null;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  animations: [
    trigger('fade', [ 
      transition('void => *', [
        style({ opacity: 0 }), 
        animate(1000, style({opacity: 1}))
      ]) 
    ])
  ]
  
})
export class LandingComponent implements OnInit {

  constructor( private cms:CommonServiceService,private router: Router, private modalService:BsModalService,private msg: InAppMessageService,private svc: RestService, private comsv:CommonServiceService) { 
    
  }
  users: User[] = []
  noDataView:boolean=false;
//  selectedMonth: number | 'FY' = 'FY';  // 'FY' means full year
//   finYearLabel: string = '';
  fromDate: string = '';
  toDate: string = '';

  currentFinYearStart = 2025; // or make dynamic if needed
  selectedMonth:number | 'FY' = 'FY';
  finYearLabel: string = '';
  months: any[] = [];
  gradient: boolean = false;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: string = 'below';
  view: any[] = [700, 400];
  totalBranch:any={}
  // Branch Profit Data
  single: any[] = [];

  // Daily Financial Summary Data
  chartData: any[] = [];

  // Premium Color Scheme with Gradients
  colorScheme2 = { domain: [ '#187dd4ff',  '#43a047',  '#fb8c00',  '#9723b8ff',  '#e53935',  '#18b4c9ff' ,  '#501e79ff'  ] };

  colorScheme = {
    domain: ['#43a047', '#e53935'] // green and red (default if needed)
  };
    customColors = this.single.map(item => ({
    name: item.name,
    value: item.value >= 0 ? '#43a047' : '#e53935' // green if +ve, red if -ve
  }));

  showXAxis: boolean = true;
  showYAxis: boolean = true;
  showXAxisLabel: boolean = true;
  yAxisLabel: string = 'Branches';
  showYAxisLabel: boolean = true;
  xAxisLabel: string = 'Amount (₹)';
  // Top Branches Data
  topBranches: any[] = [];

  filteredUsers: User[] = [];
  searchText: string = '';
  filterType: string = '';

  // Statistics
  totalUsers: number = 0;
  activeUsers: number = 0;
  inactiveUsers: number = 0;
  lockedUsers: number = 0;

  // Chart data
  userTypeData: any[] = [];
  loginStatusData: any[] = [];
  userTypeColorScheme = {
    domain: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
  };

  loginStatusColorScheme = {
    domain: ['#10b981', '#ef4444']
  };
  // Quick Actions
 quickActions: any[] = [
    { icon: 'account_balance', label: 'Deposit A/C Open' },
    { icon: 'account_balance_wallet', label: 'Deposit Transaction' },
    { icon: 'account_balance', label: 'Loan A/C Open' },
    { icon: 'account_balance_wallet', label: 'Loan Transaction' },
    { icon: 'people', label: 'Customer Open' },
    { icon: 'printer', label: 'Passbook Print' },
    { icon: 'assessment', label: 'SB/CA Statement' },
    { icon: 'android', label: 'Mobile Data Import' },
    { icon: 'android', label: 'Mobile Data Export' },
    { icon: 'article_shortcut', label: 'Member Loan Statement' },
    { icon: 'receipt', label: 'Gold Loan Delivery Letter' },
    { icon: 'bar_chart', label: 'Balance sheet' },
    { icon: 'receipt', label: 'GL Transaction Details' },
    { icon: 'help', label: 'Customer Query' },
    { icon: 'support_agent', label: 'Customer Support' }
  ];
  sys = new SystemValues();
  dashboardItem = new mm_dashboard();
  dashboardItem2 = new mm_dashboard();
  isLoading = false;
  modalRef?:BsModalRef;
  currUser:any;
  ardbName:any;
  brnName:any;
  marqueeText:any;
  randomNumberColor: string;
  private intervalId: any;
  L2L:any=localStorage.getItem('L2L')
  @ViewChild('template', { static: true }) template: TemplateRef<any>;

  ngOnInit(): void {
    this.ardbName=localStorage.getItem('societyName');
    this.brnName=localStorage.getItem('__brnName');
    this.marqueeText = `${this.ardbName} (${this.brnName})`;
    this.comsv.accOpen=false
    this.comsv.accClose=false
    this.comsv.loanDis=false
    this.comsv.loanRec=false
    this.comsv.openDayBook=false
    this.comsv.openGlTrns=false
    // when ever landing is loaded screen title should be hidden
    this.msg.sendhideTitleOnHeader(true);
    this.getDashboardItem();
    this.cms.getLocalStorageDataAsJsonArray();
    this.setFinYearLabel();
    this.generateMonthList();
    this.updateDateRange();
    this.getLogdUser();
  
    
    // if(this.L2L=='true'){
    //   this.openModal(this.template)
    // }
    // this.getCustomerList()
    // 1000 milliseconds = 1 second
        
}
getLogdUser(){
     // Getuserdetails
     this.isLoading=true;
     let login = new LOGIN_MASTER();
     login.user_id = localStorage.getItem('__userId');
     login.brn_cd = localStorage.getItem('__brnCd');
     login.ardb_cd=this.sys.ardbCD,
     
     this.svc.addUpdDel<any>('Sys/GetUserIDStatus', login).subscribe(
       res => {
         this.users=res;
         this.filteredUsers = [...res];
        console.log(this.users);
        if(this.users?.length>0){
          this.calculateStatistics();
           this.prepareChartData();
        }
        
       })
  }
   calculateStatistics(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.login_status === 'Y').length;
    this.inactiveUsers = this.users.filter(u => u.login_status === 'N').length;
    this.lockedUsers = this.users.filter(u => u.user_type === 'D').length;
  }

  prepareChartData(): void {
    // User Type Distribution
    const typeCount: { [key: string]: number } = {};
    this.users.forEach(user => {
      const type = this.getUserTypeLabel(user.user_type);
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    this.userTypeData = Object.keys(typeCount).map(key => ({
      name: key,
      value: typeCount[key]
    }));

    // Login Status Distribution
    this.loginStatusData = [
      { name: 'Active', value: this.activeUsers==0?1:this.activeUsers },
      { name: 'Inactive', value: this.inactiveUsers }
    ];
  }

  getFullName(user: User): string {
    const parts = [
      user.user_first_name?.trim(),
      user.user_middle_name?.trim(),
      user.user_last_name?.trim()
    ].filter(part => part && part !== '');
    
    return parts.length > 0 ? parts.join(' ') : 'N/A';
  }

  getInitials(user: User): string {
    const firstName = user.user_first_name?.trim() || '';
    const lastName = user.user_last_name?.trim() || '';
    
    if (!firstName && !lastName) return 'NA';
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'A': 'Administrator',
      'S': 'Super User',
      'G': 'General User',
      'X': 'Others',
      'D': 'Locked'
    };
    return labels[type] || 'Unknown';
  }

  getUserTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'A': 'type-admin',
      'S': 'type-super',
      'G': 'type-general',
      'X': 'type-others',
      'D': 'type-locked'
    };
    return classes[type] || 'type-default';
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchText || 
        user.user_id.toLowerCase().includes(this.searchText.toLowerCase()) ||
        this.getFullName(user).toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesType = !this.filterType || user.user_type === this.filterType;
      
      return matchesSearch && matchesType;
    });
  }


setCustomColors(single:any[]) {
  this.customColors = single.map(item => ({
    name: item.name,
    value: item.value >= 0 ? '#43a047' : '#e53935'
  }));
}
  quickLink(event){
switch(event) { 
   case 'Customer Support': { 
    window.open('https://support.synergicportal.in')
      //  this.router.navigate(['https://support.synergicportal.in/'])
      break; 
   } 
   case 'Mobile Data Export': { 
     window.open('https://databank.opentech4u.co.in/admin/login')
      break; 
   } 
    case 'Mobile Data Import': { 
     this.router.navigate([this.sys.BankName + '/DT_Agent_Coll_Post']);
      break; 
   } 
    case 'Print Voucher': { 
     this.router.navigate([this.sys.BankName + '/FT_PrintVoucher']);
      break; 
   }
    case 'Passbook Print': { 
     this.router.navigate([this.sys.BankName + '/DR_PbkPrn']);
      break; 
   } 
    case 'Customer Open': { 
     this.router.navigate([this.sys.BankName + '/UT_CustomerProfile']);
      break; 
   } 
    case 'Member Loan Statement': { 
     this.router.navigate([this.sys.BankName + '/LR_stmt']);
      break; 
   } 
   case 'SB/CA Statement': { 
     this.router.navigate([this.sys.BankName + '/DR_ASS']);
      break; 
   }
    case 'Loan A/C Open': { 
     this.router.navigate([this.sys.BankName + '/LT_OpenLoanAccNew']);
      break; 
   } 
    case 'Loan Transaction': { 
     this.router.navigate([this.sys.BankName + '/LT_LoanTrans']);
      break; 
   } 
    case 'Deposit Transaction': { 
     this.router.navigate([this.sys.BankName + '/DT_AccTrans']);
      break; 
   } 
   case 'Deposit A/C Open': { 
     this.router.navigate([this.sys.BankName + '/DT_OpenAcc']);
      break; 
   } 
    case 'GL Transaction Details': { 
        this.router.navigate([this.sys.BankName + '/FR_GLTD']);

      break; 
   } 
    case 'Customer Query': { 
     this.router.navigate([this.sys.BankName + '/UT_UCIC_MRG']);
      break; 
   }
   case 'Customer Query': { 
     this.router.navigate([this.sys.BankName + '/UT_UCIC_MRG']);
      break; 
   }
   case 'Customer Query': { 
     this.router.navigate([this.sys.BankName + '/UT_UCIC_MRG']);
      break; 
   }
    case 'Gold Loan Delivery Letter': { 
     this.router.navigate([this.sys.BankName + '/LR_GOLD_OPEN_REP']);
      break; 
   }  
     case 'Balance sheet': { 
     this.router.navigate([this.sys.BankName + '/FR_BalanceSheetNew']);
      break; 
   }
// 'https://outlook.office.com/calendar/view/workweek' 


   default: { 
      this.router.navigate([this.sys.BankName + '/la'])
      break; 
   } 
} 
  }
  onSelect(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
    openModal(template: TemplateRef<any>) {
      this.currUser=localStorage.getItem('__userId');
      this.modalRef = this.modalService.show(template, {class: 'modal-sm modal-dialog-centered'});
    }
    closeL2L(){
    localStorage.removeItem('L2L');
    this.modalRef?.hide()
    }
setFinYearLabel() {
  const nextYear = this.currentFinYearStart + 1;
  this.finYearLabel = `01/04/${this.currentFinYearStart} - 31/03/${nextYear}`;
}

// ✅ Generate months (Apr → Mar) in "MM/YYYY" format
generateMonthList() {
  const startYear = this.currentFinYearStart;
  const nextYear = startYear + 1;
  const today = new Date();

  this.months = [];

  // Apr–Dec (current FY start year)
  for (let m = 4; m <= 12; m++) {
    const date = new Date(startYear, m - 1, 1);
    const label = `${('0' + m).slice(-2)}/${startYear}`;
    const isFuture = date > today;
    this.months.push({ value: m, label, disabled: isFuture });
  }

  // Jan–Mar (next FY year)
  for (let m = 1; m <= 3; m++) {
    const date = new Date(nextYear, m - 1, 1);
    const label = `${('0' + m).slice(-2)}/${nextYear}`;
    const isFuture = date > today;
    this.months.push({ value: m, label, disabled: isFuture });
  }
}

// ✅ Called when user selects a month
updateDateRange() {
  const startYear = this.currentFinYearStart;
  const nextYear = startYear + 1;

  if (this.selectedMonth === 'FY') {
    const fromDate = new Date(`${startYear}-04-01T00:00:00.000Z`);
    const toDate = new Date();
    console.log('Full FY Range:', fromDate.toISOString(), 'to', toDate.toISOString());
  this.getDashboardItemAll(fromDate.toISOString(),toDate.toISOString())
    
  }
  else{
      const month = Number(this.selectedMonth);
  let year = startYear;

  if (month <= 3) {
    year = nextYear;
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 0, 0));

  console.log(
    `Month ${('0' + month).slice(-2)}/${year} Range:`,
    start.toISOString(),
    'to',
    end.toISOString()
  );
  this.getDashboardItemAll(start.toISOString(),end.toISOString())
  }

console.log(this.dashboardItem);

}

 // 🧮 Calculate date range for selected month
// updateDateRange() {
//   const today = new Date();
//   const startYear = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
//   const nextYear = startYear + 1;

//   if (this.selectedMonth === 'FY') {
//     // Full financial year
//     const finYrStart=`01/04/${startYear}`
//     const fromDate = this.formatDate(new Date(finYrStart));
//   const toDate = this.formatDate(new Date());
//     console.log('Full FY Range:', fromDate, 'to', toDate);

//     this.getDashboardItem(fromDate,toDate)
//     // return;
//   }
//   else{
//      // Calendar months 1–12 (Jan–Dec)
//   const month = Number(this.selectedMonth);
//   let year = startYear;

//   // Jan, Feb, Mar belong to the next year of FY
//   if (month <= 3) {
//     year = nextYear;
//   }

//   const start = new Date(year, month - 1, 1);
//   const end = new Date(year, month, 0); // last day of month

//   const fromDate = this.formatDate(start);
//   const toDate = this.formatDate(end);

//   console.log(`Month ${this.getMonthName(month)} Range:`, fromDate, 'to', toDate);
//   this.getDashboardItem(fromDate,toDate)
//   }

 
// }


  // ✅ Utility to format date as DD/MM/YYYY
  formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }
  getDashboardItem(){
     this.isLoading=true;
    const param = new p_gen_param();
    param.brn_cd = this.sys.BranchCode;
    param.ardb_cd=localStorage.getItem('__ardb_cd')
    console.log(param);
             this.svc.addUpdDel<any>('Common/GetDashBoardInfo', param).subscribe(
          res => {
              this.chartData=[];
              this.dashboardItem = res;
              if (this.dashboardItem?.todaysOpening) {
           this.chartData = [
            { 
              name: 'Opening Balance', 
              value: parseFloat(this.dashboardItem.todaysOpening) || 0.0 
            },
            { 
              name: 'Cash Received', 
              value: parseFloat(this.dashboardItem.cashReceived) || 0.0 
            },
            { 
              name: 'Cash Paid', 
              value: parseFloat(this.dashboardItem.cashPaid) || 0.0 
            },
            { 
              name: 'Closing Balance', 
              value: parseFloat(this.dashboardItem.todayClosing) || 0.0 
            },
            { 
              name: 'Loan Disbursed', 
              value: parseFloat(this.dashboardItem.loanDisbursedAmount) || 0.0 
            },
            { 
              name: 'Loan Recovered', 
              value: parseFloat(this.dashboardItem.loanRecoveredAmount) || 0.0 
            }
          ];
          this.isLoading=false;
          console.log(this.chartData);
          console.log(this.dashboardItem);
          
          
        }
        else{
           this.isLoading=false; 
        }
          },
          err => {
            this.isLoading=false;
            })
  }
  getDashboardItemAll(dt1,dt2) {
  this.noDataView=false;
  this.isLoading=true;
    const param = new p_gen_param();
    param.brn_cd = this.sys.BranchCode;
    param.ardb_cd=localStorage.getItem('__ardb_cd')
    console.log(param)
    var param2={
              "from_dt": dt1,
              "to_dt": dt2
            }
    // this.svc.addUpdDel<any>(this.sys.BranchCode=='100'?'Common/DashBoardPL':'Common/GetDashBoardInfo', param).subscribe(
      // if(this.sys.BranchCode=='101'){
        // this.svc.getURL<any>('Common/DashBoardPL').subscribe(
         this.svc.addUpdDel<any>('Common/DashBoardPLSummery', param2).subscribe(
            res => {
              this.single=[];
              this.dashboardItem2 = res;
              if(res.data.length>1){
                const transformedData = res.data.map(item => ({
                  name: item.branch,
                  value: item.pl
                }))
                console.log(transformedData);
                
                const totalObj = transformedData.find(x => x.name === 'TOTAL');
                const branchData = transformedData.filter(x => x.name !== 'TOTAL');
                console.log(branchData);
                console.log(totalObj);
                this.totalBranch = totalObj;
                this.single = branchData;
                this.setCustomColors(branchData);
                const performanceArray = branchData.map(b => ({
                name: b.name.replace(' BRANCH', '').trim(),
                performance: parseFloat((((+b.value) / (+totalObj.value)) * 100).toFixed(2))
              }));
              this.topBranches=performanceArray.sort((a, b) => (a.performance < b.performance ? 1 : -1))
              console.log(performanceArray);
              this.isLoading=false;

            }
              else{
                this.isLoading=false;
                this.noDataView=true;
              }
            
            
              
            },
            err => {
              this.isLoading=false;
            }
          );
       

            
          }
  
    
    
  
  accClose(){
    this.comsv.accOpen=false
    this.comsv.accClose=true
    this.comsv.loanDis=false
    this.comsv.loanRec=false
    this.comsv.openDayBook=false
    this.comsv.openGlTrns=false
    this.router.navigate([this.sys.BankName + '/DR_OpenCloseReg']);

  }
  accOpen(){
    this.comsv.accOpen=true
    this.comsv.accClose=false
    this.comsv.loanDis=false
    this.comsv.loanRec=false
    this.comsv.openDayBook=false
    this.comsv.openGlTrns=false
    this.router.navigate([this.sys.BankName + '/DR_OpenCloseReg']);

  }
  loanDis(){
    this.comsv.accOpen=false
    this.comsv.accClose=false
    this.comsv.loanDis=true
    this.comsv.loanRec=false
    this.comsv.openDayBook=false
    this.comsv.openGlTrns=false
    this.router.navigate([this.sys.BankName + '/LR_DisNorm']);

  }
  loanRec(){
    this.comsv.accOpen=false
    this.comsv.accClose=false
    this.comsv.loanDis=false
    this.comsv.loanRec=true
    this.comsv.openDayBook=false
    this.comsv.openGlTrns=false
    this.router.navigate([this.sys.BankName + '/LR_RecRegNorm']);

  }
  openDayBook(){
    this.comsv.accOpen=false
    this.comsv.accClose=false
    this.comsv.loanDis=false
    this.comsv.loanRec=false
    this.comsv.openDayBook=true
    this.comsv.openGlTrns=false
    this.router.navigate([this.sys.BankName + '/FR_DayBook']);

  }
  openGlTrns(){
    this.comsv.accOpen=false
    this.comsv.accClose=false
    this.comsv.loanDis=false
    this.comsv.loanRec=false
    this.comsv.openDayBook=false
    this.comsv.openGlTrns=true
    this.router.navigate([this.sys.BankName + '/FR_GLTD']);

  }
 

  ngOnDestroy(): void {
    // Clear the interval when the component is destroyed to prevent memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  
  }

