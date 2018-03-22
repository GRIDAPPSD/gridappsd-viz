import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { map, delay, retry } from 'rxjs/operators';

export function request(url: string, method: string = 'GET', body = {}): Observable<any> {
  return ajax({
    url,
    responseType: 'json',
    crossDomain: true,
    method,
    body
  }).pipe(map(response => response.response), delay(1000), retry(3));
}