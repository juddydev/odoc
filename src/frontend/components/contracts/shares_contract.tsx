import * as React from 'react';
import {useState} from 'react';
import {GridCell, GridRowModel} from '@mui/x-data-grid';
import {Button, ButtonGroup, Input} from '@mui/material';
import {StyledDataGrid} from "./spread_sheet";
import {useDispatch, useSelector} from "react-redux";
import {handleRedux} from "../../redux/main";
import ContextMenu from "../genral/context_menu";
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Row,
    Share,
    SharePaymentOption,
    SharesContract,
    Table,
    User
} from "../../../declarations/user_canister/user_canister.did";
import useColumnManager from "./hooks/useColumnManager";
import {useFormulaDialog} from "../../hook/dialog";
import FunctionsIcon from '@mui/icons-material/Functions';
import {updateTableContent} from "./utils/update_table";
import PayButton from "./shares_contract/pay_button";
import {RenderReceiver} from "./payment_contract/renderers";
import BasicMenu from "../genral/drop_down";
import {randomString} from "../../data_processing/data_samples";
import {Principal} from "@dfinity/principal";
import {logger} from "../../dev_utils/log_data";
import useGetUser from "../../utils/get_user_by_principal";

// export type SharesContractViews = "Payments" | "Shares" | "SharesRequests" | "PaymentOptions";

export default function SharesContract(props: any) {

    let {getUser, getUserByName} = useGetUser();
    const dispatch = useDispatch();

    const {
        files_content,
        current_file,
        all_friends,
        profile,
        contracts
    } = useSelector((state: any) => state.filesReducer);


    // ToDo  `props.data[0]` instead of `props.children[0].data[0]`
    let table_content = props.children[0]
    let initial_rows = table_content.data[0].Table.rows

    let initial_columns = table_content.data[0].Table.columns;
    // let {initial_rows, handleDeleteRow} = useRowManager({initial_rows, props})


    let {
        columns,
        handleDeleteColumn,
        handleAddColumn,
        handleColumnValidator
    } = useColumnManager({initial_columns, props});


    function normalize_share_rows(CONTRACTS, ROWS: any): Array<Row> {
        return ROWS.map((row: any) => {
            let share_id: String = row.contract && row.contract[0] && row.contract[0]["SharesContract"];
            let share: Share = contracts[table_content.id] && contracts[table_content.id].shares.filter((item: Share) => item.share_contract_id == share_id)[0];

            if (!contracts[table_content.id]) {
                console.error("-------------- contract not found", {table_id: table_content.id, CONTRACTS})
            } else if (!share) {
                console.error("-------------- Share not found", share_id, {CONTRACTS, row})
            }


            let receiver = share && getUser(share.receiver.toString());
            let res: Row = {
                "share%": share && share.share,
                "receiver": receiver ? receiver : "",
                "id": row.id,
                "contract": [{"SharesContract": row.id}],
                // "cells": row.cells,
                // requests: row && row.requests,
                ...row,
            }
            return res;
        })
    }

    const processRowUpdate = React.useCallback((newRow: GridRowModel, oldRow: GridRowModel) => {

            // ------------------ Update the extra cells ------------------ \\
            // let new_cells: Array<[string, string]> = Object.keys(newRow).map((key: string) => {
            //     return [String(key), newRow[key] || ""];
            // })
            //
            // function updateCells(newTable: Table) {
            //     const updatedRows = newTable.rows.map((row: Row) => {
            //         if (row.id === oldRow.id) {
            //             // const updatedCells = [...row.cells, ...new_cells];
            //             return {...row, cells: [new_cells]};
            //         }
            //         return row;
            //     });
            //     return {...newTable, rows: updatedRows};
            // };
            //
            // let newContent: SharesContract = updateTableContent(props, content, updateCells)
            // // TODO when hit save new data get removed, but they stored correctly in the BackEnd?
            //
            // dispatch(handleRedux("UPDATE_CONTENT", {id: current_file.id, content: newContent}));
            // dispatch(handleRedux("CONTENT_CHANGES", {id: current_file.id, changes: newContent}));


            // ------------------ Update Payment Option ------------------ \\
            let payment_options: Array<SharePaymentOption> = contracts[table_content.id].payment_options;
            if (Object.keys(newRow).toString() === ["id", "title", "amount", "description"].toString()) {
                payment_options = payment_options.map((item: SharePaymentOption) => {
                    if (item.id === oldRow.id) {
                        let new_item: SharePaymentOption = {
                            'id': newRow.id,
                            'title': newRow.title,
                            'date': "", // TODO handle and string data if needed later.
                            'description': newRow.description,
                            'amount': BigInt(newRow.amount),
                        };
                        return new_item;
                    }
                    return item
                })
                console.log("end the function here")
            }

            // ------------------ Update Contract ------------------ \\
            let updated_share_id = newRow.contract && newRow.contract[0] && newRow.contract[0]["SharesContract"];
            let receiver_name: string = newRow["receiver"];
            let receiver: User | null = getUserByName(receiver_name);

            let updated_contract: SharesContract = {
                ...contracts[table_content.id],
                "payment_options": payment_options,
                // contract_id: contract.contract_id,
                // payments: contract.payments,
                // shares_requests: contract.shares_requests,
                shares: contracts[table_content.id].shares.map((item: Share) => {
                    if (item.share_contract_id === updated_share_id) {
                        return {
                            ...item,
                            "accumulation": BigInt(item.accumulation),
                            "conformed": Boolean(item.conformed),
                            "contractor": [...item.contractor],
                            "share_contract_id": updated_share_id,
                            "share": newRow["share%"],
                            "receiver": Principal.fromText(receiver ? receiver.id.toString() : "2vxsx-fae"),
                        };
                    } else {
                        return item;
                    }
                }),
            };


            // ------------------ TODO save the contract in form of StoredContract ------------------ \\
            //                      That is in order to prevent the need for extra steps in denormalize_contracts.tsx
            //                         let contract: StoredContract = {
            //                             "SharesContract": {
            //                                 "shares": shares,
            //                                 "payments": item.payments,
            //                                 "shares_requests": item.shares_requests,
            //                                 "contract_id": item.contract_id,
            //                             }
            //                         };

            dispatch(handleRedux("UPDATE_CONTRACT", {contract: updated_contract}));
            dispatch(handleRedux("CONTRACT_CHANGES", {changes: updated_contract}));
            // revoke_message();

            return Promise.resolve(newRow);
        },
        []
    );

    const handleProcessRowUpdateError = React.useCallback(
        (params: any) => {
            console.log('An error occurred while updating the row with params:', params);
            return Promise.resolve();
        }
        , []
    );


    const {dialog, handleClickOpen} = useFormulaDialog(handleColumnValidator);


    function CustomCell(props: any) {
        let field = props.field;

        const add_row = [
            <Button onClick={() => handleAddRow(props.rowId, true)} key="two"><ArrowCircleUpIcon/></Button>,
            <Button onClick={() => handleAddRow(props.rowId, false)} key="three"><ArrowCircleDownIcon/></Button>,
            <span onClick={() => handleAddRow(props.rowId, false)} style={{width: "100px"}} key="one">Add row</span>,
        ];

        const add_column = [
            <Button onClick={() => handleAddColumn(props.column.id, true)} key="two"><ArrowCircleLeftIcon/></Button>,
            <Button onClick={() => handleAddColumn(props.column.id, false)}
                    key="three"><ArrowCircleRightIcon/></Button>,
            <span style={{width: "100px"}} key="one"
                  onClick={() => handleAddColumn(props.column.id, false)}>Add column</span>,
        ];

        let button_group_props = {
            variant: "text",
            size: "small",
            ariaLabel: "small button group",
        }


        let options = [
            {
                content: <ButtonGroup {...button_group_props}>{add_row}</ButtonGroup>,
            },
            {
                content: <ButtonGroup {...button_group_props}>{add_column}</ButtonGroup>,
                // preventClose: true,
            },

            // {
            //     content: "Delete row",
            //     icon: <DeleteIcon color={"error"}/>,
            //     onClick: () => handleDeleteRow(props.rowId),
            // },
            {
                content: "Delete column",
                icon: <DeleteIcon color={"error"}/>,
                onClick: () => handleDeleteColumn(props.column.id),
            },
            {
                content: "Formula",
                icon: <FunctionsIcon/>,
                onClick: () => handleClickOpen(props.column),
            }
        ]

        if (['receiver', 'share'].includes(field)) {
            options = options.filter((item: any) => !["Formula", "Delete column"].includes(item.content));
        }

        let children = <GridCell {...props} />;

        return <ContextMenu options={options}>
            {children}
        </ContextMenu>;

    }


    let custom_columns = columns.map((column: any) => {
        let new_column = {...column}
        switch (column.field.toLowerCase()) {
            case "receiver":
                new_column['renderEditCell'] = (props: any) => RenderReceiver({
                    ...props,
                    options: [...all_friends, profile]
                })
                return new_column
            default:
                return new_column

        }
    })

    let [view, setView] = useState("Shares");
    let [data, setDate]: any = useState({
        rows: normalize_share_rows(contracts, initial_rows),
        columns: custom_columns
    });

    const handleAddRow = (rowId: string, before: boolean) => {
        let newRow = {};
        let updated_contracts = {...contracts};

        //// ----- handle the different views -------- \\\\
        switch (view) {
            case "Payment options":
                let new_payment_option: SharePaymentOption = {
                    id: randomString(),
                    title: "",
                    amount: 0n,
                    description: "",
                    date: "",
                };

                console.log({rowId})
                let optionRowIndex = contracts[table_content.id].payment_options.findIndex((item: SharePaymentOption) => item.id === rowId);
                let optionStep = before ? 0 : 1;
                contracts[table_content.id].payment_options.splice(optionRowIndex + optionStep, 0, new_payment_option);
                let payment_options_updated_contract = {
                    ...contracts[table_content.id],
                    "payment_options": contracts[table_content.id].payment_options
                };
                updated_contracts[table_content.id] = payment_options_updated_contract
                // logger({"Payment options": updated_contracts[table_content.id]})
                newRow = {
                    id: new_payment_option.id,
                    description: "",
                    amount: 0n,
                    title: "",
                }
                setDate((pre) => {
                    let new_rows = [...pre.rows];
                    new_rows.splice(optionRowIndex + optionStep, 0, newRow);
                    return {...pre, rows: new_rows}
                })
                dispatch(handleRedux("CONTRACT_CHANGES", {changes: updated_contracts[table_content.id]}));
                // dispatch(handleRedux("UPDATE_CONTRACT", {contract: updated_contract}));
                break;
            case "Shares":
                const new_share_id = randomString();
                const new_share: Share = {
                    share_contract_id: new_share_id,
                    accumulation: 0n,
                    conformed: true,
                    share: 0n,
                    receiver: Principal.fromText("2vxsx-fae"), // TODO fix this not anonymous
                    contractor: [],
                };
                updated_contracts[table_content.id] = {
                    ...contracts[table_content.id],
                    shares: [...contracts[table_content.id].shares, new_share]
                };

                newRow = {
                    id: new_share_id,
                    contract: [{"SharesContract": new_share_id}],
                    cells: [],
                    requests: [],
                };

                ///// ------- get the correct positioning --------- \\\
                const rowIndex = props.children[0].data[0].Table.rows.findIndex((row) => row.id === rowId);
                if (rowIndex === -1) {
                    // Row not found, handle the error or return early
                    return;
                }
                let step = before ? 0 : 1;

                /// ------------------- \\\
                let newTableRows = [...data.rows];
                // // add the new row
                newTableRows.splice(rowIndex + step, 0, newRow);

            function updateRows(newTable: Table) {
                newTable.rows = newTableRows;
                setDate({
                    ...data,
                    rows: newTableRows
                })
                return newTable;
            }

                let content = files_content[current_file.id];
                const newContent = updateTableContent(props, content, updateRows);


                // in this case we are not adding a new contract we are just adding new share to the current contracts
                // so there is no need to the following line
                // dispatch(handleRedux("ADD_CONTRACT", {id: contract.contract_id, contract}));
                dispatch(handleRedux("UPDATE_CONTENT", {id: current_file.id, content: newContent}));
                dispatch(handleRedux("CONTENT_CHANGES", {id: current_file.id, changes: newContent}));
                dispatch(handleRedux("CONTRACT_CHANGES", {changes: updated_contracts[table_content.id]}));
                // dispatch(handleRedux("UPDATE_CONTRACT", {contract: updated_contract}));
                break;
            default:
                console.error("Unknown view")
                break;

        }

        //// --------------- Cell Update ----------------- \\\\
        // const cells = props.children[0].data[0].Table.rows[0].cells[0];
        //
        // if (cells && cells.length > 0) {
        //     const cell_name = cells[0][0];
        //     newRow.cells = [[[cell_name, ""]]];
        // }


    };

    let Click = (e: string) => {
        setView(e);
        switch (e) {
            case 'Shares':
                setDate({
                    rows: normalize_share_rows(contracts, initial_rows),
                    columns: custom_columns
                });
                break;
            case "Payments":
                setDate({
                    rows: [
                        {id: 1, sender: 'Ali', amountUSDC: '14', "date": "2020-11-01"},
                        {id: 2, sender: 'John', amountUSDC: '14', "date": "2020-10-01"},
                    ],
                    columns: [
                        {field: 'sender', headerName: 'sender', width: 150},
                        {field: 'amountUSDC', headerName: 'amountUSDC', width: 150},
                        {field: 'date', headerName: 'date', width: 150},
                    ]
                });
                break
            case 'Payment options':
                let payment_options_rows = contracts[table_content.id].payment_options.map((payment_option: SharePaymentOption) => {
                    let payment_option_row = {
                        id: payment_option.id,
                        title: payment_option.title,
                        amount: payment_option.amount,
                        // date: payment_option.date,
                        description: payment_option.description,
                    };
                    return payment_option_row
                })
                setDate({
                    rows: payment_options_rows,
                    columns: [

                        {field: 'title', headerName: 'title', width: 150, editable: true},
                        {field: 'amount', headerName: 'amount', width: 150, editable: true},
                        {field: 'description', headerName: 'description', width: 150, editable: true},
                    ]
                });


        }

    }

    return (
        <div contentEditable={false}
             style={{maxHeight: "25%", maxWidth: '100%'}}
        >
            {dialog}
            {view && <StyledDataGrid
                {...data}
                // rows={data}
                // columns={renderColumns}
                // disableColumnSelector
                hideFooterPagination
                editMode="row"
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                slots={{
                    cell: CustomCell,
                    toolbar: () => <ButtonGroup variant="text" size={'small'}>
                        <BasicMenu
                            options={[
                                {content: "Shares", Click},
                                {content: "Payment options", Click},
                                {content: "Payments", Click}
                            ]}>{view}</BasicMenu>
                        <Button>Filter</Button>
                        <PayButton contract={contracts[table_content.id]}/>
                    </ButtonGroup>
                }}

            />}


        </div>
    );
}
