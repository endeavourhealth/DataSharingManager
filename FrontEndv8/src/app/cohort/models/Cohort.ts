export class Cohort {
    uuid : string;
    name:string;
    consentModelId: string;
    description: string;
    technicalDefinition: string;
    dpas : { [key:string]:string; };
    dsas : { [key:string]:string; };
    projects : { [key:string]:string; };

    getDisplayItems() :any[] {
        return [
            {label: 'Name', property: 'name', secondary: false},
            {label: 'Description', property: 'description', secondary: true},
        ];
    }
}
