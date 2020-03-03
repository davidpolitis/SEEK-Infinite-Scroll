// ==UserScript==
// @name         SEEK Infinite Scroll
// @namespace    https://www.seek.com.au/
// @version      0.1
// @description  Adds infinite scrolling to SEEK searches
// @author       You
// @match        https://www.seek.com.au/jobs*
// @connect      seek.com.au
// @grant        GM.xmlHttpRequest
// ==/UserScript==

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
            if (entries[0].intersectionRatio == 1)
            {
                console.log('Loading next page...');

                GM.xmlHttpRequest( {
                    method: 'GET',
                    url: nextPage,
                    onload: function(response) {
                        let nextPageDoc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        let nextPageResults = getResultsWrapper(nextPageDoc);
                        for (let node of nextPageResults.childNodes) {
                            let newNode = document.importNode(node, true);
                            resultWrapper.appendChild(newNode);
                        }

                        observer.unobserve(lastResult);

                        getNextPageOnScroll(nextPageDoc.body);
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