import { Component, OnInit, OnDestroy, ViewChildren, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControlName, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';

import { ButtonGroupAlignment } from 'igniteui-angular';
interface IButton {
ripple ?: string;
label ?: string;
disabled ?: boolean;
togglable ?: boolean;
selected ?: boolean;
color ?: string;
icon ?: string;
}

class Button {
private ripple: string;
private label: string;
private disabled: boolean;
private togglable: boolean;
private selected: boolean;
private color: string;
private icon: string;
constructor(obj?: IButton) {
this.ripple = obj.ripple || 'gray';
this.label = obj.label;
this.selected = obj.selected || false;
this.togglable = obj.togglable;
this.disabled = obj.disabled || false;
this.color = obj.color;
this.icon = obj.icon;
}
}

@Component({
    selector: 'app-screen1',
    templateUrl: './screen1.component.html',
    styleUrls: ['./screen1.component.scss']
})
export class Screen1Component implements OnInit, OnDestroy, AfterViewInit {

    @ViewChildren(FormControlName, { read: ElementRef }) formInputElements: ElementRef[];

public alignment = ButtonGroupAlignment.vertical;
public buttongrouphorizontal = [
new Button({
label: 'Home',
}),
new Button({
label: 'products',
}),
new Button({
label: 'documents',
}),
new Button({
label: 'assignments',
}),
];


    constructor(
        private route: ActivatedRoute,
        private router: Router,
            private formBuilder: FormBuilder) {
    }

    ngOnInit(): void {
    /*
    */
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
    }

}

