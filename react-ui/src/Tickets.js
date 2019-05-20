import React from 'react';
import './App.css';
import {Card, Button} from 'react-bootstrap';


class Tickets extends React.Component {
    constructor() {
        super();
        this.state = {
            tickets: [],
        };
    }

    componentDidMount() {
        fetch('https://ticket-system-react.herokuapp.com/rest/list')
        .then(results => results.json())
        .then(data => this.setState({tickets: data}))
        .catch(console.log);
    }

    render() {
        return (
            <div>
                <h2>Tickets</h2>
                <div>
                    {this.state.tickets.map(ticket=>
                    <Card>
                        <Card.Header>Ticket: {ticket.id}</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                <p key={ticket.id}>Created at: {ticket.created_at}</p>
                                <p key={ticket.id}>Updated at: {ticket.updated_at}</p>
                                <p key={ticket.id}>Type: {ticket.type}</p>
                                <p key={ticket.id}>Subject: {ticket.subject}</p>
                                <p key={ticket.id}>Description: {ticket.description}</p>
                                <p key={ticket.id}>Priority: {ticket.priority}</p>
                                <p key={ticket.id}>Status: {ticket.status}</p>
                                <p key={ticket.id}>Recipient: {ticket.recipient}</p>
                                <p key={ticket.id}>Submitter: {ticket.submitter}</p>
                                <p key={ticket.id}>Tags: {ticket.tags}</p> 
                            </Card.Text>
                            <Button variant="primary">Edit</Button>
                            <Button variant="primary">Delete</Button>
                        </Card.Body>
                    </Card>
                    )}
                </div>
            </div>
        );
    }
}

export default Tickets;