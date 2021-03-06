// Copyright 2011-2013 Proofpoint, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//  http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


Ext.define('service_record_data',{
	extend: 'Ext.data.Model',
	fields:[
		'name','environment_name','value'
	]
});

Ext.define('PP.ServiceViewPanel',{
	extend:'Ext.FormPanel',
	require:'Ext.grid.Panel',
	alias: 'widget.serviceviewpanel',
	// frame:true,
	entity:'service_instance',
	// data_entity: 'service_instance_data',
	layout_view:'vertical',
	service:{},
	defaultType:'textfield',
	layout:'border',
	maskDisabled:false,
	editing:false,
	trackResetOnLoad:true,
	bodyPadding: 5,
	tbar:[],
	deleted_overides:[],
	deleteServiceInstanceDataRecord: function(attr){
		if( this.grid.store.getAt(this.grid.store.find('name',attr)) )
		{
			var attr_rec=this.grid.store.getAt(this.grid.store.find('name',attr));
			attr_rec.set('environment_name','n/a');
			this.deleted_overides.push(attr);
			this.saveButton.enable();
			this.cancelButton.enable();



return;

			Ext.Msg.confirm('Confirm','Are you sure you want to delete this record?<br>This cannot be undone',function(btn){
				if(btn == 'yes')
				{
					var rec=this.grid.store.getById(id);
					this.grid.store.remove(rec);
					rec.destroy({
						success: function(){
							PP.notify.msg('Success', 'Record deleted');
							this.loadData();
						},
						failure: function(op){
							Ext.Msg.alert('Error', 'There was an error deleting the record in the remote store' + "<br>" + op.response.responseText);
						},
						scope: this
					});					
				}
			},this);
		}
	},
	reset: function(){
		if(this.selectedService)
		{
			this.getForm().getFields().each(function(f){
			    f.originalValue=undefined;
			});
			this.getForm().reset(true);
			this.grid.getStore().loadData([]);
			this.selectedService=null;			
		}
	},
	initComponent: function(){
		this.saveButton=new Ext.Button({
			icon:'/extjs/examples/shared/icons/save.gif',
			cls:'x-btn-text-icon',
			// disabled:true,
			text:'Save',
			disabled:true,
			scope:this,
			handler:this.saveRecord
		});
		this.cancelButton=new Ext.Button({
			xtype: 'button',
			text: 'Cancel',
			disabled: true,
			handler: function(){
				this.load(this.selectedService);
			},
			scope: this
		});

		if(this.editing)
		{
			this.tbar.push({xtype:'tbfill'});
			this.tbar.push(this.saveButton);
			this.tbar.push(this.cancelButton);			
		}
		this.dataStore=new Ext.data.Store({
			model: 'service_record_data',
			sorters:[
			{ property: 'name',direction: 'ASC'}
			]
		});
		this.grid=new Ext.grid.Panel({
			region: 'center',
			title: 'Properties',
			store: this.dataStore,
			panel: this,
			selType: 'rowmodel',
			viewConfig:{
				getRowClass:function(rec,indx,dep,store){
					if(rec.get('environment_name') != Ext.getCmp('service_view').selectedService.get('environment_name'))
					{					
						return 'inherited';
					}
				}
			},
			plugins: ( this.editing ? [
   				Ext.create('Ext.grid.plugin.CellEditing', {
				    clicksToEdit: 1,
				    listeners: {
				        beforeedit: {
							scope: this,
							fn: function(ed,e) {
								if(!PP.allowEditing)
								{
									return false;
								}
								if( e.record.get('environment_name') != this.selectedService.get('environment_name') )
								{
									Ext.Msg.show({
										title: 'Create Override?',
										msg: 'An override value in your environment will allow you to define different service settings',
										buttons: Ext.Msg.YESNO,
										icon: Ext.Msg.QUESTION,
										fn:function(btn){
											if(btn == 'yes')
											{
												e.record.set('environment_name',this.selectedService.get('environment_name'));			
												this.saveButton.enable();
												this.cancelButton.enable();
											}	
										},
										scope: this
									});
									return false;
								}
							}
				        },
				        edit: {
				        	scope: this,
				        	fn: function(ed,e,opts){
								this.saveButton.enable();
								this.cancelButton.enable();
				        	}
				        }
				    }
				})

			] : undefined ),
		    columns:[
				{header: 'Name', dataIndex: 'name', field: 'textfield',flex:1},
				{header: 'Value', dataIndex: 'value', field: 'textfield',flex:1},
				{header: 'Env.',width:50, dataIndex: 'environment_name', field: 'textfield'},
				{header: '',dataIndex: 'name', renderer:function(v,meta,rec){ 
					if(this.up('serviceviewpanel').selectedService.get('environment_name') == rec.get('environment_name'))
					{
						return '<span style="font-size:10px;cursor: pointer;color:#666;" onclick="Ext.getCmp(\'' + this.up('serviceviewpanel').getId() + '\').deleteServiceInstanceDataRecord(\'' + v + '\');">Delete</span> ';
					}
				}, width: 47}

			],
			tbar: (this.editing ? [
				{
					text: 'New',
					handler: function(){
						var p = Ext.ModelManager.create({}, 'service_record_data');
						var g=this.grid;	
						var svp=this;
						if(svp.saveButton)
						{
							svp.saveButton.enable();
						}
						
						if(g.panel.getForm().getRecord())
						{
							p.set('svc_id',g.panel.getForm().getRecord().get('svc_id'));
							g.store.insert(0, p);
					        g.editingPlugin.startEdit(p, g.columns[0]);							
						}
					},
					scope: this
				}
			] : undefined)
		});
		
		this.items=[
			{
				region: 'north',
				height: 140,
				xtype:'fieldset',
				border: false,
				defaultType:'textfield',
				defaults:{
					anchor: '100%'
				},
				items:[
					{
						fieldLabel: 'SVC ID',
						xtype:'hidden',
						name: 'svc_id'
					},
					{
						fieldLabel: 'Name',
						name: 'name'
					},
					{
						fieldLabel: 'Type',
						name: 'type'
					},
					{
						fieldLabel: 'Note',
						name: 'note'
					}
				]
			},
			this.grid
		];
		var env_name_field=PP.getEditorConfig('environment_name',{entity:this.entity});
		env_name_field.xtype='displayfield';
		this.items[0].items.push(env_name_field);
		PP.ServiceViewPanel.superclass.initComponent.call(this);
		this.addListener({
			'dirtychange': function(fp,dirty,opts) {
				if(dirty){
					this.saveButton.enable();
					this.cancelButton.enable();
				}
				else
				{
					this.saveButton.disable();
					this.cancelButton.disable();
				}
			},
			scope: this
		});
	},
	saveRecord:function(){
		if(PP.allowEditing && this.getForm().getRecord())
		{
			var svc_rec = this.getForm().getRecord().getData();
			this.grid.getStore().each(function(prop){
				if(prop.get('environment_name') == this.selectedService.get('environment_name'))
				{
					svc_rec[prop.get('name')]=prop.get('value');
				}
			},this);
			for(var i=0;i<this.deleted_overides.length;i++)
			{
				svc_rec[this.deleted_overides[i]]=null;
			}
			Ext.Ajax.request({
				method: 'PUT',
				scope: this,
				jsonData: svc_rec,
				url: PP.config.cmdb_api_path + 'environments/' + this.selectedService.get('environment_name') + '/services/' + this.selectedService.get('name')+ '?_tag_environment=1',
				success: function(response,opts){
					PP.notify.msg('Success', 'Record Saved');
					var updated_rec=Ext.ModelManager.create(Ext.decode(response.responseText), 'service_record_data');

					this.selectedService.data=updated_rec.data;
					this.selectedService.raw=updated_rec.raw;
					this.deleted_overides=[];
					this.load(this.selectedService);
					if(this.saveButton)
					{
						this.saveButton.disable();
						this.cancelButton.disable();
					}
				},
				failure: function(response){
					Ext.Msg.alert('Error', 'There was an error saving the record in the remote store' + "<br>" + 
							response.responseText
						     );
				}
			});

		}
	},
	loadData: function(){
		var i=this.selectedService;
		this.grid.store.loadData([],false);

		var keys=Object.keys(this.selectedService.raw);
		var ds_recs=[];
		for(var i=0;i < keys.length; i++)
		{
			if(keys[i] == 'name' || keys[i] == 'environment_name' || keys[i] == 'type')
			{
				continue;
			}
			ds_recs.push({
				name: keys[i], 
				environment_name: this.selectedService.raw[keys[i]].environment_name,
				value: this.selectedService.raw[keys[i]].value
			});
		}
		this.dataStore.add(ds_recs);
		return;
	},
	load: function(svc){
		this.selectedService=svc;
		this.loadRecord(svc);
		this.loadData();
		this.saveButton.disable();
		this.cancelButton.disable();
		// this.grid.store.load({params:{svc_id:svc.get('svc_id')}});
	}
});
