
/*
 * Copyright (C) 2018 Matus Zamborsky
 * This file is part of Cyano Wallet.
 *
 * Cyano Wallet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cyano Wallet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cyano Wallet.  If not, see <http://www.gnu.org/licenses/>.
 */
import * as React from 'react';
import { RouterProps } from 'react-router';
import { getIdentity } from '../../../../api/identityApi';
import { dummy, reduxConnect, withProps } from '../../../compose';
import { GlobalState } from '../../../redux';
import { IdentityDashboardView, Props } from './identityDashboardView';

const mapStateToProps = (state: GlobalState) => ({
  walletEncoded: state.wallet.wallet
});

const enhancer = (Component: React.ComponentType<Props>) => (props: RouterProps) => (
  reduxConnect(mapStateToProps, dummy, (reduxProps) => (
    withProps({
      ontId: getIdentity(reduxProps.walletEncoded!)!
    }, (injectedProps) => (
      <Component {...injectedProps} />
    ))
  ))
);

export const IdentityDashboard = enhancer(IdentityDashboardView);
