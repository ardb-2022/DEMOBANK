import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from './EncryptionService.service';

@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {

  constructor(private encryptionService: EncryptionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    let modifiedReq = req;

    // 🔐 Encrypt request body
    if (req.body && typeof req.body === 'object') {
      // const encryptedBody = this.encryptionService.encryptObject(req.body);
      // modifiedReq = req.clone({
      //   body: { data: encryptedBody }
      // });
    }

    return next.handle(modifiedReq).pipe(
      map(event => {

        // 🔓 Decrypt response
        if (event instanceof HttpResponse && event.body?.data) {
          const decrypted = this.encryptionService.decryptToObject(event.body.data);

          return event.clone({
            body: decrypted
          });
        }

        return event;
      })
    );
  }
}