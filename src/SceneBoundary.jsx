import React from 'react';
import './sceneBoundary.css';

// Switch to an interactive 2D map if a renderer cannot start or loses context.
export default class SceneBoundary extends React.Component {
 constructor(props){super(props);this.state={failed:false,attempt:0};this.onLost=this.onLost.bind(this);this.retry=this.retry.bind(this);this.root=React.createRef()}
 static getDerivedStateFromError(){return {failed:true}}
 componentDidMount(){this.root.current.addEventListener('webglcontextlost',this.onLost,true)}
 componentWillUnmount(){this.root.current?.removeEventListener('webglcontextlost',this.onLost,true)}
 componentDidUpdate(prev){if(prev.force2d&&!this.props.force2d&&this.state.failed)this.setState(s=>({failed:false,attempt:s.attempt+1}))}
 componentDidCatch(error){console.warn('3D view unavailable; switching to 2D:',error);this.props.onFallback?.()}
 onLost(event){event.preventDefault();this.setState({failed:true});this.props.onFallback?.()}
 retry(){this.setState(s=>({failed:false,attempt:s.attempt+1}));this.props.onRetry?.()}
 render(){return <div className="scene-boundary" ref={this.root}>
  {this.state.failed||this.props.force2d?(this.props.fallback?this.props.fallback(this.retry):<div className="scene-fallback" role="status"><strong>3D view unavailable</strong><p>The catalogue and details are still available.</p><button type="button" onClick={this.retry}>Retry 3D view</button></div>):<React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>}
 </div>}
}
