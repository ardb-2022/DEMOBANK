import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, map, tap } from 'rxjs';
import { ChequeBook, Cheque, AccountInfo, AccountType } from '../../../Models/deposit/chequeBook';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ChequeBookService {
   constructor(private http: HttpClient, private router: Router) {}
  static serverIp = 'demobanking.synergicapi.in';
   private getUrl(): string {
    
    const __bName = localStorage.getItem('__bName');
    
     return 'https://' + ChequeBookService.serverIp + '/' + __bName + '/api/';


  }
  public addUpdDel<T>(ofwhat: string, data: T): Observable<T> {
    return this.http.post<T>((this.getUrl() + ofwhat), data);
  }


  private chequeBookSubject = new BehaviorSubject<ChequeBook | null>(null);
  public chequeBook$ = this.chequeBookSubject.asObservable();

  private chequesSubject = new BehaviorSubject<Cheque[]>([]);
  public cheques$ = this.chequesSubject.asObservable();

  private accountsSubject = new BehaviorSubject<AccountInfo[]>([
    {
      acc_type_cd: 1,
      acc_num: '101101620',
      issue_dt: '01/08/2022',
      chq_no_from: '016276',
      chq_no_to: '016300',
      acc_name: 'SUSANTA KUMAR MOHAPATRA'
    },
    {
      acc_type_cd: 1,
      acc_num: '101101621',
      issue_dt: '08/02/2016',
      chq_no_from: '113951',
      chq_no_to: '113975',
      acc_name: 'ANOTHER ACCOUNT HOLDER'
    }
  ]);
  public accounts$ = this.accountsSubject.asObservable();

  // Account types mapping
  private accountTypes: AccountType[] = [
    { code: 1, name: 'Savings A/C' },
    { code: 7, name: 'Current A/C' },
    { code: 23115, name: 'Cash Credit Loan' }
  ];

  private mockCheques: Cheque[] = [
  ];

  getAccountTypes(): AccountType[] {
    return this.accountTypes;
  }

  getAccountTypeName(code: number): string {
    const accountType = this.accountTypes.find(type => type.code === code);
    return accountType ? accountType.name : 'Unknown';
  }

  getChequeBook(cheque: ChequeBook): Observable<ChequeBook> {
  console.log(cheque);

  const chequeBook: ChequeBook = cheque;
  this.chequeBookSubject.next(chequeBook);

  return this.getChequeData(cheque).pipe(
    // tap so you can store the result before returning the chequeBook
    tap((cheques: Cheque[]) => {
      this.mockCheques = cheques;
      this.chequesSubject.next(cheques);
    }),
    map(() => chequeBook) // return chequeBook to the subscriber
  );
}
 
  getChequeData(cheque: ChequeBook): Observable<Cheque[]> {
    const payload = {
      acc_type_cd: cheque.acc_type_cd,
      acc_num: cheque.acc_num,
      chq_bk_no: cheque.chq_bk_no
    };

    return this.addUpdDel<any>('Deposit/GetChqIssueData', payload).pipe(
      map(res => {
        if (res && res.length > 0) {
          console.log('Cheque data:', res);
          return res as Cheque[];
        } else {
          console.log('No cheque data found:', res);
          return [];
        }
      },
    err=>{
        console.log('No cheque data found:', err);
          return [];
    })
    );
  }
  SaveChequeData(cheque: ChequeBook): Observable<Cheque[]> {
    const arary=[];
    arary.push(cheque);
    return this.addUpdDel<any>('Deposit/InsertChqDtls',arary).pipe(
      map(res => {
        if (res && res.length > 0) {
          console.log('Cheque data:', res);
          return res as Cheque[];
        } else {
          console.log('No cheque data found:', res);
          return [];
        }
      },err=>{
        console.log('No cheque data found:', err);
          return [];
    })
    );
}
  saveChequeBook(chequeBook: ChequeBook): Observable<ChequeBook> {
    // Simulate API call
    console.log('Saving cheque book:', chequeBook);
    this.chequeBookSubject.next(chequeBook);
    // return of(chequeBook);
    return this.SaveChequeData(chequeBook).pipe(
    // tap so you can store the result before returning the chequeBook
    tap((cheques: Cheque[]) => {
      this.mockCheques = cheques;
      this.chequesSubject.next(cheques);
    }),
    map(() => chequeBook) // return chequeBook to the subscriber
  );
  }

  createChequeBook(chequeBook: Partial<ChequeBook>): Observable<ChequeBook> {
    const newChequeBook: ChequeBook = {
      acc_type_cd: chequeBook.acc_type_cd || 1,
      acc_num: chequeBook.acc_num || '',
      acc_name: chequeBook.acc_name || '',
      chq_bk_no: chequeBook.chq_bk_no || '',
      issue_dt: chequeBook.issue_dt || new Date(),
      chq_no_from: chequeBook.chq_no_from || '',
      chq_no_to: chequeBook.chq_no_to || '',
      approval_status: 'Pending',
      created_by: 'CURRENT_USER', // Replace with actual user
      created_dt: new Date(),
      approved_by: '',
      approved_dt: null,
      brn_cd:'',
      chq_version: chequeBook.chq_version || 3
    };

    this.chequeBookSubject.next(newChequeBook);
    return of(newChequeBook);
  }

  // approveChequeBook(acc_num: string, approved_by: string): Observable<ChequeBook> {
  //   const currentChequeBook = this.chequeBookSubject.value;
  //   if (currentChequeBook && currentChequeBook.acc_num === acc_num) {
  //     const approvedChequeBook: ChequeBook = {
  //       ...currentChequeBook,
  //       approval_status: 'A',
  //       approved_by: localStorage.getItem('__userId'),
  //       approved_dt: new Date(),
  //       brn_cd:
  //     };
      
  //     this.chequeBookSubject.next(approvedChequeBook);
  //     return of(approvedChequeBook);
  //   }
    
  //   return of(currentChequeBook!);
  // }
  ApproveChequeData(cheque: ChequeBook): Observable<Cheque[]> {
    const approvedChequeBook: ChequeBook = {
        ...cheque,
        approval_status: 'A',
        approved_by: localStorage.getItem('__userId'),
        approved_dt: new Date(),
        brn_cd:localStorage.getItem('__brnCd')
      };
      console.log(approvedChequeBook);
      
    return this.addUpdDel<any>('Deposit/ApproveChequeBook',approvedChequeBook).pipe(
      map(res => {
        return res;
        // if (res && res.length > 0) {
        //   console.log('Cheque data:', res);
        //   return res as Cheque[];
        // } else {
        //   console.log('No cheque data found:', res);
        //   return [];
        // }
      },
    err=>{
      return err
    })
    );
}
  deleteChequeBook(acc_num: string): Observable<boolean> {
    // Simulate API call
    // console.log('Deleting cheque book for account:', acc_num);
    this.chequeBookSubject.next(null);
    this.chequesSubject.next([]);
    return of(true);
  }

  addNewCheque(): void {
    const currentCheques = this.chequesSubject.value;
    if (currentCheques.length > 0) {
      const lastCheque = currentCheques[currentCheques.length - 1];
      const newNo = String(parseInt(lastCheque.chq_no) + 1).padStart(6, '0');
      
      const updatedCheques = [...currentCheques, {
        chq_no: newNo,
        chq_status: 'I' as const
      }];
      
      this.chequesSubject.next(updatedCheques);

      // Update cheque book range if needed
      const currentChequeBook = this.chequeBookSubject.value;
      if (currentChequeBook) {
        const updatedChequeBook: ChequeBook = {
          ...currentChequeBook,
          chq_no_to: newNo
        };
        this.chequeBookSubject.next(updatedChequeBook);
      }
    }
  }

  toggleChequeStatus(chequeNo: string): void {
    const currentCheques = this.chequesSubject.value;
    const cheque = currentCheques.find(c => c.chq_no === chequeNo);
    if (cheque) {
      cheque.chq_status = cheque.chq_status === 'I' ? 'I' : 'U';
      this.chequesSubject.next([...currentCheques]);
    }
  }

  generateChequeRange(from: string, to: string): Cheque[] {
    const cheques: Cheque[] = [];
    const fromNum = parseInt(from);
    const toNum = parseInt(to);
    
    for (let i = fromNum; i <= toNum; i++) {
      cheques.push({
        chq_no: i.toString().padStart(6, '0'),
        chq_status: 'I'
      });
    }
    
    return cheques;
  }
 
 
}