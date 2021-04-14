import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { merge, Observable, of, Subject } from "rxjs";
import { concatMap, map, scan, tap } from "rxjs/operators";
import { Action, Command, Contact, HTTPMethods } from "./models";

@Injectable()
export class UserService {
  constructor(private http: HttpClient) {}

  private loadingSub = new Subject<boolean>();
  loading$ = this.loadingSub.asObservable();

  //our source observable from the api
  private rawUserContacts$ = this.http
    .get<Contact[]>("https://jsonplaceholder.typicode.com/users")
    .pipe(
      map(contacts =>
        contacts.map(
          contact =>
            ({
              ...contact,
              profilePic: `https://robohash.org/${contact.id}`
            } as Contact)
        )
      )
    );

  //user actions are caught with this observable
  private contactsCrudAction$ = new Subject<Command>();

  contacts$ = merge(
    this.rawUserContacts$,
    //components are only responsible for sending the actions
    // the business logic for handling that should happen here
    this.contactsCrudAction$.pipe(
      map(command => {
        switch (command.action) {
          case Action.CREATE:
            return {
              ...command,
              contactToCRD: this.createNewContact()
            };
          case Action.UPDATE:
            return {
              ...command,
              contactToCRD: { ...command.contactToCRD, ...command.payload }
            };
          default:
            return command;
        }
      }),
      tap(() => this.loadingSub.next(true)),
      concatMap(contactCommand => this.persistContact(contactCommand)),
      tap(() => this.loadingSub.next(false))
    )
  ).pipe(
    scan((contacts: Contact[], command: Command) =>
      this.takeAction(contacts, command)
    )
  );

  //HELPER METHODS

  //Only exposed method to allow consumers to send commands

  submitCommand(command: Command) {
    this.contactsCrudAction$.next(command);
  }

  createNewContact() {
    const id = Math.floor(Math.random() * 100000);
    return {
      name: "Chandler",
      id,
      phone: "123-452-1234",
      profilePic: `https://robohash.org/${id}`
    } as Contact;
  }

  private takeAction(contacts: Contact[], command: Command): Contact[] {
    switch (command.action) {
      case Action.CREATE:
        return [...contacts, command.contactToCRD];
      case Action.UPDATE:
        return this.updateArrayInPlace(contacts, command.contactToCRD);
      case Action.DELETE:
        return contacts.filter(
          contact => contact.id !== command.contactToCRD.id
        );
    }
  }

  private persistContact(command: Command): Observable<Command> {
    switch (command.action) {
      case Action.CREATE:
        return (
          this.http
            .post<Contact>(
              "https://jsonplaceholder.typicode.com/users",
              command.contactToCRD
            )
            //typically you wanna return the res from the
            //server but this api returns
            //your resource with id 11
            .pipe(map(res => ({ ...command })))
        );
      case Action.UPDATE:
        return this.http
          .put<Contact>(
            `https://jsonplaceholder.typicode.com/users/${
              command.contactToCRD.id
            }`,
            command.contactToCRD
          )
          .pipe(
            map(res => ({
              ...command,
              contactToCRD: res
            }))
          );
      case Action.DELETE:
        return this.http
          .delete<any>(
            `https://jsonplaceholder.typicode.com/users/${
              command.contactToCRD.id
            }`
          )
          .pipe(map(res => command));
    }
  }

  //Method to update our state in place immutably
  private updateArrayInPlace(
    contacts: Contact[],
    updatedContact: Contact
  ): Contact[] {
    const contactToUpdate = contacts.find(
      contact => contact.id === updatedContact.id
    );
    const contactToUpdateIDX = contacts.indexOf(contactToUpdate);
    const filteredContacts = contacts.filter(
      contact => contact.id !== contactToUpdate.id
    );

    const firstArrHalf = filteredContacts.slice(0, contactToUpdateIDX);
    const lastArrHalf = filteredContacts.slice(
      contactToUpdateIDX,
      filteredContacts.length
    );

    return [...firstArrHalf, updatedContact, ...lastArrHalf];
  }
}
