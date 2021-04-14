import { Component, VERSION } from "@angular/core";
import { tap } from "rxjs/operators";
import { Action, Contact } from "./models";
import { UserService } from "./user.service";

@Component({
  selector: "app-body",
  templateUrl: "app.component.html",
  styleUrls: []
})
export class AppComponent {
  constructor(private userService: UserService) {}
  contacts$ = this.userService.contacts$;
  loading$ = this.userService.loading$;

  addContact() {
    this.userService.submitCommand({
      action: Action.CREATE,
      contactToCRD: null
    });
  }

  deleteContact(contact: Contact) {
    this.userService.submitCommand({
      action: Action.DELETE,
      contactToCRD: contact
    });
  }

  updateContact(contact: Contact, value, property: string) {
    if (contact[property] === value) return;
    this.userService.submitCommand({
      action: Action.UPDATE,
      contactToCRD: contact,
      payload: { [property]: value }
    });
  }
}
