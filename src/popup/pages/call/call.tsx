/*
 * Copyright (C) 2018 Matus Zamborsky
 * This file is part of The Ontology Wallet&ID.
 *
 * The The Ontology Wallet&ID is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Ontology Wallet&ID is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with The Ontology Wallet&ID.  If not, see <http://www.gnu.org/licenses/>.
 */
import { get } from 'lodash';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { GlobalState } from '../../../redux/state';
import { ScCallRequest } from '../../../redux/transactionRequests';
import { reduxConnect, withProps } from '../../compose';
import { Actions } from '../../redux';
import { CallView, InitialValues, Props } from './callView';

const mapStateToProps = (state: GlobalState) => ({
  loading: state.loader.loading,
  password: state.password.password,
  requests: state.transactionRequests.requests,
  trustedScs: state.settings.trustedScs,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      finishLoading: Actions.loader.finishLoading,
      resolveRequest: Actions.transactionRequests.resolveRequest,
      startLoading: Actions.loader.startLoading,
      submitRequest: Actions.transactionRequests.submitRequest,
      updateRequest: Actions.transactionRequests.updateRequest,
    },
    dispatch,
  );

const enhancer = (Component: React.ComponentType<Props>) => (props: RouteComponentProps<any>) =>
  reduxConnect(mapStateToProps, mapDispatchToProps, (reduxProps, actions, getReduxProps) =>
    withProps(
      {
        handleCancel: async () => {
          props.history.goBack();

          const requestId: string = get(props.location, 'state.requestId');
          await actions.resolveRequest(requestId, 'CANCELED');
        },
        handleConfirm: async (values: object) => {
          const requestId: string = get(props.location, 'state.requestId');

          const contract: string = get(values, 'contract');
          const method: string = get(values, 'method');
          const gasPrice = Number(get(values, 'gasPrice', '0'));
          const gasLimit = Number(get(values, 'gasLimit', '0'));

          // todo: no type check ScCallRequest
          await actions.updateRequest(requestId, {
            contract,
            gasLimit,
            gasPrice,
            method,
          } as Partial<ScCallRequest>);

          if (reduxProps.password !== undefined) {
            // check if we already have password stored

            const trustedSc = reduxProps.trustedScs.find((t) => t.contract === contract);
            if (trustedSc !== undefined && trustedSc.password === false) {
              // check if password is not required

              await actions.startLoading();
              await actions.submitRequest(requestId, reduxProps.password);
              await actions.finishLoading();

              const requests = getReduxProps().requests;
              const request = requests.find((r) => r.id === requestId);

              if (request === undefined) {
                throw new Error('Request not found');
              }

              if (request.error !== undefined) {
                props.history.push('/sendFailed', { ...props.location.state, request });
              } else {
                props.history.push('/dashboard', { ...props.location.state, request });
              }

              return;
            }
          }

          props.history.push('/confirm', { requestId, redirectSucess: '/dashboard', redirectFail: '/sendFailed' });
        },
        initialValues: {
          contract: get(props.location, 'state.contract', ''),
          gasLimit: String(get(props.location, 'state.gasLimit', 0)),
          gasPrice: String(get(props.location, 'state.gasPrice', 0)),
          method: get(props.location, 'state.method', ''),
        } as InitialValues,
        locked: get(props.location, 'state.locked', false),
      },
      (injectedProps) => <Component {...injectedProps} loading={reduxProps.loading} />,
    ),
  );

export const Call = enhancer(CallView);
