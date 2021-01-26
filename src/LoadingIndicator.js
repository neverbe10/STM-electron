import React from 'react';
import styled from 'styled-components';


const Spinner = styled('div')`
  .lds-ellipsis {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }
  .lds-ellipsis div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background-color: rgba(0,0,0, .2);
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }
  .lds-ellipsis div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3 0.6s infinite;
  }
  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
  ${props => {
    if (props.full) {
      return `
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 90vh;
        justify-content: space-around;
        align-items: center;
  
        .lds-ellipsis {
          zoom: .75;
        }
      `;
    } else if (props.small) {
      return `
        text-align: center;
        .lds-ellipsis {
          height: 14px;
          zoom: .5;
          
          div {
            top: 0;
          }
        }
      `;
    } else {
      return `
        text-align: center;
        .lds-ellipsis {
          zoom: .75;
        }
      `;
    }
  }}
`;


export default (props) => {
  return (
    <Spinner {...props}>
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </Spinner>
  )
}