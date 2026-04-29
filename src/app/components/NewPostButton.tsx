import {Component} from "react";

export class NewPostButton extends Component<{ onClick: () => void }> {
    render() {
        return <div className="flex justify-center w-full">
            <button
                onClick={this.props.onClick}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg top-6 transition-colors"
                aria-label="Create new post"
                data-test-it="new-post"
                data-test-id="new-post-button"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
            </button>
        </div>;
    }
}
