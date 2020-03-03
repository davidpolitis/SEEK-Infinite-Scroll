// ==UserScript==
// @name         SEEK Infinite Scroll
// @namespace    https://davidpolitis.net/
// @author    	 David Politis
// @version      1.0
// @date		 2020-03-04
// @description  Adds infinite scrolling to SEEK searches
// @match        https://www.seek.com.au/jobs*
// @connect      seek.com.au
// @grant        GM.xmlHttpRequest
// @copyright	 2019, David Politis
// ==/UserScript==

var xhrLocked = false;

function getResultsWrapper(doc)
{
    return doc.querySelector('div._3MPUOLE');
}

function getPagination(doc)
{
    return doc.querySelector('p._1eeNbu7');
}

function getNextPageOnScroll(doc)
{
    let pagination = getPagination(doc);
    let nextPageElement = pagination.querySelector('a[data-automation="page-next"]');
    if (nextPageElement !== null)
    {
        let nextPage = nextPageElement.href;
        let resultWrapper = getResultsWrapper(document);
        let lastResult = resultWrapper.lastElementChild;

        // Use Observer to check if last element has been scrolled past
        let observer = new IntersectionObserver(entries => {
            if (entries[0].intersectionRatio == 1 && !xhrLocked)
            {
                console.log('Loading next page...');

                xhrLocked = true;

                GM.xmlHttpRequest( {
                    method: 'GET',
                    timeout: 60000,
                    url: nextPage,
                    onload: function(response) {
                        let nextPageDoc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        let nextPageResults = getResultsWrapper(nextPageDoc);
                        for (let node of nextPageResults.childNodes) {
                            if (!(node.firstChild.getAttribute('data-automation') == 'premiumJob'))
                            {
                                let newNode = document.importNode(node, true);
                                resultWrapper.appendChild(newNode);
                            }
                        }

                        xhrLocked = false;
                        observer.unobserve(lastResult);

                        lastResult.scrollIntoView();

                        return getNextPageOnScroll(nextPageDoc.body);
                    },
                    onerror: function() {
                        xhrLocked = false;
                    },
                    ontimeout: function() {
                        xhrLocked = false;
                    }
                });
            }
        }, {threshold: 1});

        observer.observe(lastResult);
    }
}

(function() {
    'use strict';

    let pagination = getPagination(document);

    let isFirstPage = (pagination.firstChild.tagName == "SPAN");

    if (isFirstPage)
    {
        getNextPageOnScroll(document);

        // remove footer
        let wholeFooter = document.querySelector('div._390Wdxi');
        wholeFooter.parentNode.removeChild(wholeFooter);
    }
})();
