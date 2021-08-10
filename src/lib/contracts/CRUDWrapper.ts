import Web3 from 'web3';
import * as CrudJson from '../../../build/contracts/Crud.json';
import { Crud } from '../../types/Crud'

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class CrudWrapper {
    web3: Web3;

    contract: Crud;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(CrudJson.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    //create
    async create(name: string, fromAddress: string) {
        const tx = await this.contract.methods.create(name).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }


    //read
    async read(id: number, fromAddress: string) {
        const tx = await this.contract.methods.read(id).call({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    //update
    async update(id: number, name: string, fromAddress: string) {
        const tx = await this.contract.methods.update(id, name).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    //destroy
    async destroy(id: number, fromAddress: string) {
        const tx = await this.contract.methods.destroy(id).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }
    

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: CrudJson.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}