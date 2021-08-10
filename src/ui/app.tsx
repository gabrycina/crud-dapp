/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { CrudWrapper } from '../lib/contracts/CRUDWrapper';
import { CONFIG } from '../config';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    interface User {
        0: string,
        1: string
    }
    
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<CrudWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();

    const [createdUser, setCreatedUser] = useState<string| undefined>();
    const [readUser, setReadUser] = useState<Array<User> | undefined>();
    const [readId, setReadId] = useState<string| undefined>();
    const [updatedUser, setUpdatedUser] = useState<string[] | undefined>();
    const [editId, setEditId] = useState<string | undefined>();
    const [editName, setEditName] = useState<string | undefined>();
    const [deletedUser, setDeletedUser] = useState<number| undefined>();
    const [newDeletedUser, setNewDeletedUser] = useState<number| undefined>();

    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new CrudWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new CrudWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
    }

    //create
    async function create() {
        const value = await contract.create(createdUser, account);
        toast('Successfully created a name', { type: 'success' });
        
        setCreatedUser(createdUser);
    }


    //read
    async function read() {
        const value = await contract.read(parseInt(readId), account);
        toast('Successfully read', { type: 'success' });

        setReadUser([value]);
    }

    //update
    async function update() {
        const value = contract.update(parseInt(editId), editName, account);
        toast('Successfully updated', { type: 'success' });

        setUpdatedUser([editId, editName]);
    }

    //destroy
    async function destroy() {
        const value = contract.destroy(newDeletedUser, account);
        toast('Successfully destroyed', { type: 'success' });

        setDeletedUser(deletedUser);
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />

            <div className="container">
                <div className="row">
                    <div className="col-sm-12">
                    <h1>Crud</h1>
                    <form id="create">
                        <h2>Create user</h2>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input 
                                onChange={e => setCreatedUser(e.target.value)}
                                id="name" type="text" className="form-control" />
                        </div>
                        <button onClick={create} type="submit" className="btn btn-primary">Submit</button>
                        <p id="create-result">
                            {createdUser ? <>&nbsp;&nbsp;Successfully Created User Name: {createdUser.toString()}</> : null}
                        </p>
                    </form>

                    <hr />

                    <form id="read">
                        <h2>Read user</h2>
                        <div className="form-group">
                            <label htmlFor="read-id">Id</label>
                            <input 
                                onChange={e => setReadId(e.target.value)}
                                id="read-id" type="number" className="form-control" />
                        </div>
                        <button onClick={read} type="submit" className="btn btn-primary">Submit</button>
                        <p id="read-result">
                            {readUser 
                                ? <>&nbsp;&nbsp;Id: {readUser[0].toString()} &nbsp;&nbsp;Name: {readUser[1].toString()}</>
                                 : null}
                        </p>
                    </form>

                    <hr />

                    <form id="edit">
                        <h2>Edit user</h2>
                        <div className="form-group">
                            <label htmlFor="edit-id">Id</label>
                            <input 
                                onChange={e => setEditId(e.target.value)}
                                id="edit-id" type="number" className="form-control" />
                            <label htmlFor="edit-name">Name</label>
                            <input 
                                onChange={e => setEditName(e.target.value)}
                                id="edit-name" type="text" className="form-control" />
                        </div>
                        <button onClick={update} type="submit" className="btn btn-primary">Submit</button>
                        <p id="edit-result">
                            {updatedUser ? <>&nbsp;&nbsp; Changed name of user {updatedUser[0].toString()} to {updatedUser[1].toString()}</> : null}
                        </p>
                    </form>

                    <hr />

                    <form id="delete">
                        <h2>Delete user</h2>
                        <div className="form-group">
                            <label htmlFor="delete-id">Id</label>
                            <input 
                                onChange={e => setNewDeletedUser(parseInt(e.target.value))}
                                id="delete-id" type="number" className="form-control" />
                        </div>
                        <button onClick={destroy} type="submit" className="btn btn-primary">Submit</button>
                        <p id="delete-result">
                            {deletedUser ? <>&nbsp;&nbsp; Successfully deleted user with id: {deletedUser.toString()}</> : null}
                        </p>
                    </form>

                    </div>
                </div>    
            </div>

            <br />
            <br />
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
