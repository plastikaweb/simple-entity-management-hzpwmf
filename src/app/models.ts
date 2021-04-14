export interface Contact {
  id: number;
  name: string;
  username: string;
  email: string;
  address: Address;
  phone: string;
  website: string;
  company: Company;
  profilePic: string;
}

export interface Command {
  action: Action;
  contactToCRD: Contact;
  payload?: {};
}

export enum Action {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete"
}

export enum HTTPMethods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete"
}

interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}

interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: Geo;
}

interface Geo {
  lat: string;
  lng: string;
}
