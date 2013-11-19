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

Ext.define('PP.GraphitePanel',{
    extend:'Ext.panel.Panel',
    alias: 'widget.graphitepanel',
    frame:true,
    layout:'border',
    currentGraph:{
        metric: 'CPU.cpu_user',
        from: '-12hours',
        until: 'now'
    },
    system_fqdn:'',
    listeners: {
        'resize':{
            fn: function(p){
                p.setGraph();
            }
        },
        'activate':{
            fn: function(p){
                p.setGraph();
            }
        },
        'boxready':{
            fn: function(p){
                p.setGraph();
            }
        }
    },
    loaded:false,
    title: 'Graphite',
    setGraph:function(){
        if(!this.centerRegion)
        {
            this.centerRegion=this.down('panel[region=center]');            
        }
        var graphUrl=PP.config.graphitePath + "?from=";
        var targets=this.system_fqdn.split(',');
        graphUrl+= this.currentGraph.from + "&until=" + this.currentGraph.until;
        graphUrl+= "&width=" + this.centerRegion.getBox().width + "&height=" + this.centerRegion.getBox().height;
        for(var l=0;l<targets.length;l++)
        {
            graphUrl+= "&target=" + PP.config.graphiteMetricsPrefix +  "." + targets[l].replace(/\./g,'_') + "." + this.currentGraph.metric;
        }
        graphUrl+= "&_uniq=0.9507563426159322&hideLegend=false&title=" + this.currentGraph.metric;
        this.layout.centerRegion.update("<img src='" + graphUrl + "'>");
        this.loaded=true;
    },
    load:function(system_fqdn){
        this.loaded=false;
        if(system_fqdn)
        {
            this.system_fqdn=system_fqdn;
        }
        if(!this.loaded && this.isVisible())
        {
            this.setGraph();            
        }
        if(!this.westRegion) 
        {
            this.westRegion=this.down('panel[region=west]');
        }
        var targets=this.system_fqdn.split(',');
        this.westRegion.setRootNode({
            id: PP.config.graphiteMetricsPrefix + '.' + targets[0].replace(/\./g,'_'),
            text: system_fqdn
        });
    },
    items:[
        {
            region: 'west',
            xtype: 'treepanel',
            title: 'Metrics',
            width: 150,
            collapsed: true,
            animCollapse: false,
            collapsible: true,
            hideCollapseTool:true,
            titleCollapse:true,
            preventHeader:true,
            hideHeaders:true,
            rootVisible:false,
            split:false,
            tbar: [
                {
                    text:'Time -12hours',
                    menu: {
                        xtype: 'menu',
                        listeners: {
                            'hide':{
                                fn: function(menu){
                                    menu.up('treepanel').collapse();
                                }
                            }
                        },
                        items:[
                        {
                            text:'-12hours',
                            handler: function(i){
                                var gpanel=i.up('panel[xtype=graphitepanel]');
                                gpanel.currentGraph.from=i.text;
                                i.up('button').setText('Time ' + i.text);
                                gpanel.setGraph();
                            }
                        },
                        {
                            text:'-24hours',
                            handler: function(i){
                                var gpanel=i.up('panel[xtype=graphitepanel]');
                                gpanel.currentGraph.from=i.text;
                                i.up('button').setText('Time ' + i.text);
                                gpanel.setGraph();
                           }
                        },
                        {
                            text: '-1weeks',
                            handler: function(i){
                                var gpanel=i.up('panel[xtype=graphitepanel]');
                                gpanel.currentGraph.from=i.text;
                                i.up('button').setText('Time ' + i.text);
                                gpanel.setGraph();
                            }
                        }
                        ]
                    }
                }
            ],
            listeners: {
                'itemclick': {
                    fn: function(view,rec) {
                        console.log(rec);    
                        var gpanel=view.up('panel[xtype=graphitepanel]');
                        gpanel.currentGraph.metric=rec.id.replace(rec.store.getRootNode().id + '.','');
                        rec.getOwnerTree().collapse();
                        gpanel.setGraph();
                    },
                },
                'beforeitemexpand':  {
                    fn: function (node) {
                        if(!node.isExpandable())
                        {
                            return;
                        }
                        var node_id = node.id.replace(/^[A-Za-z.\-0-9]+./,'*');
                        var proxy=node.getOwnerTree().getStore().getProxy();
                        proxy.setExtraParam('query', (node_id == "") ? "*" : (node_id + ".*"));
                        proxy.setExtraParam('format' , 'treejson');
                        proxy.setExtraParam('contexts' , '1');
                        proxy.setExtraParam('path' ,node_id);
                    },
                    scope: this
                }
            },
            store: new Ext.data.TreeStore({
                proxy: {
                    type: 'ajax',
                    url: PP.config.graphiteMetricsPath + 'find/',
                    extraParams:{
                        format: 'treejson',
                        contexts: 1,

                    },
                    pageParam: undefined,
                    sortParam: undefined,
                    groupParam: undefined,
                    filterParam: undefined
                },
                root: {
                    expanded:false,
                    leaf: true
                }
            })
        },
        {
            xtype: 'panel',
            region: 'center',
            layout: 'fit',
            html: "This is where the graph will be"
        }
    ]
});
